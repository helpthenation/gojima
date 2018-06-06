# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models
from datetime import timedelta
from odoo.tools import DEFAULT_SERVER_DATE_FORMAT as DF ,DEFAULT_SERVER_DATETIME_FORMAT as DFT
import datetime
import ast
import pytz

class PosOrder(models.Model):
    _inherit = 'pos.order'

    kitchen_state = fields.Selection([('to_delivery','To Delivery'),('delivered', 'Delivered')], default='to_delivery', string="Kitchen")
    trace = fields.Boolean("Trace", default = False)
    dine_in = fields.Boolean("Dine-in" , default = False)
    takeaway = fields.Boolean("Take away" , default = False)


    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res['dine_in'] = ui_order['dine_in']
        res['takeaway'] = ui_order['takeaway']
        return res

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
        for record in self.search([('kitchen_state','=','delivered'),('date_order','>=',last_day.strftime(DF))]):
            single_list = []
            id = record.id
            format_date = fields.Datetime.from_string(record.date_order)
            date = fields.Datetime.to_string(fields.Datetime.context_timestamp(self, format_date))
            kitchen_state = record.kitchen_state
            name = record.name
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
        domain = []           
        last_day = fields.Date.from_string(fields.Date.today()) - timedelta(days=1)
        multiple_list = []
        domain += [('kitchen_state','=','to_delivery'),('date_order','>=',last_day.strftime(DF))]        
        for record in self.search(domain):
            single_list = []
            id = record.id
            kitchen_state = record.kitchen_state
            name = record.name
            format_date = fields.Datetime.from_string(record.date_order)
            date = fields.Datetime.to_string(fields.Datetime.context_timestamp(self, format_date))
            print ("===============date,id",date)
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



class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    extra_notes = fields.Char("Extras")
    extra_notes_visible = fields.Text(compute='_compute_extra_notes_visible', store=True)

    @api.model
    def search_order(self, order):
        return self.search_read([('order_id','=',order)])

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


class ProductProduct(models.Model):
    _inherit = 'product.product'

    visibility_in_pos = fields.Boolean('Allow Choosing Extra')
    kitchen_name = fields.Char("Kitchen Name")

# class ProductExtraLine(models.Model):
#     _name = 'main.extra.line'
    
#     main_extra_id = fields.Many2one('product.extra', 'Main')
#     product_id = fields.Many2one('product.product','Product')
#     internal_refer = fields.Char(related = "product_id.default_code",string='Internal Refer:')
#     qty_on_hand = fields.Float(related = "product_id.qty_available",string='Qty Available')
#     forecasted_qty = fields.Float(related = "product_id.virtual_available", string='Qty Forecasted')
#     public_price = fields.Float(related = "product_id.lst_price", string='Selling Price')  


class ProductExtraLine(models.Model):
    _name = 'extra.line'
    
    extra_id = fields.Many2one('product.extra', 'Extra')
    product_id = fields.Many2one('product.product','Product')
    internal_refer = fields.Char(related = "product_id.default_code",string='Internal Refer:')
    kitchen_name = fields.Char(related = "product_id.kitchen_name",string='Kitchen Name')
    qty_on_hand = fields.Float(related = "product_id.qty_available",string='Qty Available')
    forecasted_qty = fields.Float(related = "product_id.virtual_available", string='Qty Forecasted')
    public_price = fields.Float(related = "product_id.lst_price", string='Selling Price')  

class ProductExtra(models.Model):
    _name = 'product.extra'

    name = fields.Char('Name')
    # choice = fields.Selection([('single','Single'),('multiple','Multiple')],string='Single Choice', default='single')
    extra_line = fields.One2many('extra.line','extra_id','Extra')
    # main_extra_line = fields.One2many('main.extra.line','main_extra_id','Main')

    @api.model
    def method_in_extra(self,product):
        multiple_list = []
        for record in self.env['product.extra'].search([]):
            single_list = []
            extra_name = record.name
            for rec in record.extra_line:
                # image = rec.product_id.image
                product = rec.product_id.name
                price = rec.public_price
                temp1 = (extra_name,product,price)
                single_list.append(temp1)
            dict = { extra_name:single_list}           
            multiple_list.append(dict)
        return multiple_list

class PosConfig(models.Model):
    _inherit = 'pos.config'

    kitchen_screen = fields.Boolean(default=False)
 
