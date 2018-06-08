# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models

class ProductProduct(models.Model):
    _inherit = 'product.product'
#visibility_in_pos -->allow to choose extra addons in product
#kitchen name -->alternate name for product in kitchen screen/recall screen
    visibility_in_pos = fields.Boolean('Allow Choosing Extra')
    kitchen_name = fields.Char("Kitchen Name")

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
    extra_line = fields.One2many('extra.line','extra_id','Extra')
    
#method call from js to get all product extra    
    @api.model
    def get_extra(self,product):
        multiple_list = []
        for record in self.env['product.extra'].search([]):
            single_list = []
            extra_name = record.name
            for rec in record.extra_line:
                product = rec.product_id.name
                price = rec.public_price
                tup = (extra_name,product,price)
                single_list.append(tup)
            dict = { extra_name:single_list}           
            multiple_list.append(dict)
        return multiple_list