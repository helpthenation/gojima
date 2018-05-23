# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, tools


class GojimaPosOrder(models.Model):
    _inherit = "pos.order"
    _description = "Point of Sale Orders"
    _order = "id desc"

    amount_tax_order = fields.Float(compute='_compute_amount_extra', string='Taxes', digits=0.0, store=True)
    amount_total_order = fields.Float(compute='_compute_amount_extra', string='Total', digits=0.0, store=True)

    @api.depends('statement_ids', 'lines.price_subtotal_incl', 'lines.discount')
    def _compute_amount_extra(self):
        for order in self:
            # order.amount_paid = order.amount_return = order.amount_tax = 0.0
            currency = order.pricelist_id.currency_id
            # order.amount_paid = sum(payment.amount for payment in order.statement_ids)
            # order.amount_return = sum(payment.amount < 0 and payment.amount or 0 for payment in order.statement_ids)
            order.amount_tax_order = currency.round(sum(self._amount_line_tax(line, order.fiscal_position_id) for line in order.lines))
            amount_untaxed = currency.round(sum(line.price_subtotal for line in order.lines))
            order.amount_total_order = order.amount_tax + amount_untaxed


class PosOrderReport(models.Model):
    _name = "gojima.report.pos.order"
    _inherit = ['base_groupby_extra']
    _description = "Point of Sale Orders Details"
    _auto = False
    _order = 'date desc'

    date = fields.Datetime(string='Date Order', readonly=True)
    amount_total_order = fields.Float(string='Gross Sales', digits=0)
    price_total = fields.Float(string='Net Sales', readonly=True)
    order_id = fields.Many2one('pos.order', string='Order', readonly=True)
    tran_count = fields.Float(string='Transaction Count', readonly=True)
    avg_tran = fields.Float(string='Average Transaction Value', readonly=True)

    @api.model_cr
    def init(self):
        tools.drop_view_if_exists(self._cr, self._table)
        query = """
            CREATE OR REPLACE VIEW %s AS (
                SELECT
                    row_number() OVER () AS id,
                    s.date_order AS date,
                    SUM(s.amount_total_order) AS amount_total_order,
                    SUM(s.amount_total_order) - SUM(s.amount_tax_order) AS price_total,
                    s.id AS order_id,
                    COUNT(DISTINCT s.id) AS tran_count,
                    s.amount_total_order/(select count(id) from pos_order) AS avg_tran
                FROM
                    pos_order s
                GROUP BY s.id
                ORDER BY tran_count desc
            )
        """ % (self._table)
        self._cr.execute(query)


class PosOrderCountReport(models.Model):
    _name = "gojima.count.report.pos.order"
    _inherit = ['base_groupby_extra']
    _description = "Point of Sale Orders Details Report"
    _auto = False
    _order = 'product_id desc'

    date = fields.Datetime(string='Date Order', readonly=True)
    tran_count = fields.Float(string='Transaction Amount', readonly=True)
    # avg_tran = fields.Float(string='Average Transaction Value', readonly=True)
    product_id = fields.Many2one('product.product', string='Product', readonly=True)
    order_id = fields.Many2one('pos.order', string='Order', readonly=True)
    partner_id = fields.Many2one('res.partner', string='Customer', readonly=True)
    # product_tmpl_id = fields.Many2one('product.template', string='Product Template', readonly=True)
    # state = fields.Selection(
    #     [('draft', 'New'), ('paid', 'Paid'), ('done', 'Posted'),
    #      ('invoiced', 'Invoiced'), ('cancel', 'Cancelled')],
    #     string='Status')
    user_id = fields.Many2one('res.users', string='Salesperson', readonly=True)
    price_sub_total = fields.Float(string='Sub Total', readonly=True)
    total_discount = fields.Float(string='Total Discount', readonly=True)
    average_price = fields.Float(string='Average Price', readonly=True, group_operator="avg")
    # location_id = fields.Many2one('stock.location', string='Location', readonly=True)
    company_id = fields.Many2one('res.company', string='Company', readonly=True)
    # nbr_lines = fields.Integer(string='# of Lines', readonly=True, oldname='nbr')
    product_qty = fields.Integer(string='Product Quantity', readonly=True)
    # journal_id = fields.Many2one('account.journal', string='Journal')
    # delay_validation = fields.Integer(string='Delay Validation')
    # product_categ_id = fields.Many2one('product.category', string='Product Category', readonly=True)
    # invoiced = fields.Boolean(readonly=True)
    # config_id = fields.Many2one('pos.config', string='Point of Sale', readonly=True)
    # pos_categ_id = fields.Many2one('pos.category', string='PoS Category', readonly=True)
    # stock_location_id = fields.Many2one('stock.location', string='Warehouse', readonly=True)
    # pricelist_id = fields.Many2one('product.pricelist', string='Pricelist', readonly=True)
    # session_id = fields.Many2one('pos.session', string='Session', readonly=True)

    @api.model_cr
    def init(self):
        tools.drop_view_if_exists(self._cr, self._table)
        query = """
            CREATE OR REPLACE VIEW %s AS (
                SELECT row_number() OVER () AS id,
                    s.date_order AS date,
                    SUM(s.amount_total_order) AS tran_count,
                    s.id AS order_id,
                    s.partner_id AS partner_id,
                    s.user_id AS user_id,
                    l.product_id AS product_id,
                    s.company_id AS company_id,
                    SUM(l.qty) AS product_qty,
                    SUM(l.qty * l.price_unit) AS price_sub_total,
                    SUM((l.qty * l.price_unit) * (l.discount / 100)) AS total_discount,
                    (SUM(l.qty*l.price_unit)/NULLIF(SUM(l.qty * u.factor),0))::decimal AS average_price
                FROM
                    pos_order s
                LEFT JOIN pos_order_line l ON (s.id=l.order_id)
                LEFT JOIN product_product p ON (l.product_id=p.id)
                LEFT JOIN product_template pt ON (p.product_tmpl_id=pt.id)
                LEFT JOIN product_uom u ON (u.id=pt.uom_id)
                GROUP BY s.id, l.product_id
                ORDER BY amount_total_order
            )
        """ % (self._table)
        self._cr.execute(query)

    @api.model
    def read_group(self, domain, fields, groupby, offset=0, limit=None, orderby=False, lazy=True):
        # import pdb;pdb.set_trace()
        if ['id', '!=', False] in domain:
            top_most = 10
            self.env.cr.execute('select product_id, count(product_id) as cnt from gojima_count_report_pos_order group by product_id order by cnt desc limit %s' % (top_most))
            so_list = []
            for rec in self.env.cr.fetchall():
                sol_ids = self.env['gojima.count.report.pos.order'].search([('product_id', '=', rec[0])])
                so_list.extend(list(set([x.order_id.id for x in sol_ids])))
            print("so_list : ", so_list)
            domain.extend([['id', 'in', so_list]])
            print("domain : ", domain)
            domain.extend([['company_id', '=', self.env.user.company_id.id]])
        return super(PosOrderCountReport, self).read_group(domain, fields, groupby, offset=offset, limit=limit, orderby=orderby, lazy=lazy)
