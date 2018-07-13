# -*- coding: utf-8 -*

from odoo import models, fields, api
from odoo.exceptions import Warning

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    used_in_mrp = fields.Boolean(string='Used in Mrp')

    @api.onchange('used_in_mrp')
    def onchange_used_in_mrp(self):
        if self.used_in_mrp:
            if not self.bom_count:
                raise Warning('Bill of Material is not Configured.')


class ProductProduct(models.Model):
    _inherit = 'product.product'

    @api.onchange('used_in_mrp')
    def onchange_used_in_mrp(self):
        if self.used_in_mrp:
            if not self.bom_count:
                raise Warning('Bill of Material is not Configured.')
