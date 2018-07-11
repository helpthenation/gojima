# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import datetime
import ast
#This can be used for safely evaluating strings containing Python values
#from untrusted sources without the need to parse the values oneself. 
#It is not capable of evaluating arbitrarily complex expressions, 
#for example involving operators or indexing.
import pytz

from odoo import api, fields, models
from datetime import timedelta
from odoo.tools import DEFAULT_SERVER_DATE_FORMAT as DF ,DEFAULT_SERVER_DATETIME_FORMAT as DFT

class PosOrder(models.Model):
    _inherit = 'pos.order'

    kitchen_state = fields.Selection([('to_delivery','To Delivery'),('delivered', 'Delivered')], default='to_delivery', string="Kitchen")
    trace = fields.Boolean("Trace", default = False)
    dine_in = fields.Boolean("Dine-in" , default = False)
    takeaway = fields.Boolean("Take away" , default = False)
    customer_table = fields.Char("Table No/Customer")

#added new fields and save it values in pos
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res['dine_in'] = ui_order['dine_in']
        res['takeaway'] = ui_order['takeaway']
        res['customer_table'] = ui_order['customer_table']
        return res

#For state changing and tracibility of recall order
    @api.multi
    def move_next(self):
        for rec in self:
            rec.kitchen_state = 'delivered'
            rec.trace = False
     
    @api.multi
    def move_back(self):
        for rec in self:
            rec.kitchen_state = 'to_delivery'
            rec.trace = True

    @api.model
    def search_kitchen_recall_state(self):
        last_day = fields.Date.from_string(fields.Date.today()) - timedelta(days=1)
        multiple_list = []
        pos_session = self.env['pos.session'].search([('state', '=', 'opened')])
        for record in self.search([('kitchen_state','=','delivered'),('date_order','>=',last_day.strftime(DF)),('session_id','in',pos_session.ids)]):
            single_list = []
            id = record.id
            format_date = fields.Datetime.from_string(record.date_order)
            date = fields.Datetime.to_string(fields.Datetime.context_timestamp(self, format_date))
            kitchen_state = record.kitchen_state
            name = record.pos_reference
            trace = record.trace
            dine_in = record.dine_in
            takeaway = record.takeaway
            list = [date,kitchen_state,name,trace,dine_in,takeaway]
            for rec in record.lines:
                product = rec.product_id.kitchen_name or rec.product_id.name
                qty = rec.qty
                extra_notes = rec.extra_notes
                if extra_notes:
                    extra_notes = ast.literal_eval(extra_notes)
                tup = [product,qty,extra_notes]    
                single_list.append(tup)
            vals = [{'single': single_list}]
            new_tuple = list + vals
            dict = { id:new_tuple}
            multiple_list.append(dict)
        return multiple_list

    @api.model
    def search_kitchen_state(self):
        last_day = fields.Date.from_string(fields.Date.today()) - timedelta(days=1)
        multiple_list = []
        pos_session = self.env['pos.session'].search([('state', '=', 'opened')])
        for record in self.search([('kitchen_state','=','to_delivery'),('date_order','>=',last_day.strftime(DF)),('session_id','in',pos_session.ids)]):
            single_list = []
            id = record.id
            kitchen_state = record.kitchen_state
            name = record.pos_reference
            format_date = fields.Datetime.from_string(record.date_order)
            date = fields.Datetime.to_string(fields.Datetime.context_timestamp(self, format_date))
            trace = record.trace
            dine_in = record.dine_in
            takeaway = record.takeaway
            customer_table = record.customer_table
            list = [date,kitchen_state,name,trace,dine_in,takeaway,customer_table]
            for rec in record.lines.sorted(key=lambda r: r.sequence):
                product = rec.product_id.kitchen_name or rec.product_id.name
                qty = rec.qty
                extra_notes = rec.extra_notes
                if extra_notes:
                    extra_notes = ast.literal_eval(extra_notes)
                root_category = 'uncategorized'
                if rec.product_id.pos_categ_id:
                    root_category = rec.product_id.pos_categ_id.name
                    if rec.product_id.pos_categ_id and rec.product_id.pos_categ_id.parent_id:
                        root_category = rec.product_id.pos_categ_id.parent_id.name
                        if rec.product_id.pos_categ_id and rec.product_id.pos_categ_id.parent_id and rec.product_id.pos_categ_id.parent_id.parent_id:
                            root_category = rec.product_id.pos_categ_id.parent_id.parent_id.name 
                root_category = root_category.capitalize()
                tup = [product,qty,extra_notes,root_category]
                single_list.append(tup)
            vals = [{'single': single_list}]
            new_tuple = list + vals
            dict = { id:new_tuple}
            multiple_list.append(dict)
        return multiple_list

class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    extra_notes = fields.Char("Extras")
    extra_notes_visible = fields.Text(compute='_compute_extra_notes_visible', store=True)
    sequence = fields.Integer(default=100)

    @api.model
    def create(self, vals):
        if vals.get('product_id'):
            product = self.env['product.product'].browse(vals['product_id'])
            if product.pos_categ_id:
                vals['sequence'] = product.pos_categ_id.sequence
                if product.pos_categ_id and product.pos_categ_id.parent_id:
                    vals['sequence'] = product.pos_categ_id.parent_id.sequence
                    if product.pos_categ_id and product.pos_categ_id.parent_id and product.pos_categ_id.parent_id.parent_id:
                        vals['sequence'] = product.pos_categ_id.parent_id.parent_id.sequence
        return super(PosOrderLine, self).create(vals)


    @api.model
    def search_order(self, order):
        return self.search_read([('order_id','=',order)])

#Extra notes visibility in pos order (Format from  complex format to simple list format)
    @api.one
    @api.depends('extra_notes')
    def _compute_extra_notes_visible(self):        
        if self.extra_notes and len(self.extra_notes) > 2:
            product_list = ''
            for rec in ast.literal_eval(self.extra_notes):
                for key,value in rec.items():
                    product_list += key + '' + value[0]
                    product_list += '\n'
            self.extra_notes_visible = product_list