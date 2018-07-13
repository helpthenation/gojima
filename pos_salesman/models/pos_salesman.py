# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _
from odoo.exceptions import UserError

class ResPartner(models.Model):
    _inherit = 'res.partner'

    is_pos_salesman = fields.Boolean("Is Pos Salesman")
    # pos_security_pin_partner = fields.Char(string='Security PIN', size=32, help='A Security PIN used to protect sensible functionality in the Point of Sale')

    # @api.constrains('pos_security_pin_partner')
    # def _check_pin(self):
    #     if self.pos_security_pin_partner and not self.pos_security_pin_partner.isdigit():
    #         raise UserError(_("Security PIN can only contain digits"))

class PosConfig(models.Model):
    _inherit = 'pos.config'

    sale_person_ids = fields.Many2many('res.partner', 'pos_config_partner_rel',
        'pos_config_id', 'partner_id',string='Available Sales Person',
        domain="[('is_pos_salesman', '=', True )]")

class PosOrder(models.Model):
    _inherit = 'pos.order'

    sale_person_id = fields.Many2one('res.partner', 'Sales Person')

    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res['sale_person_id'] = ui_order['sale_person_id']
        return res