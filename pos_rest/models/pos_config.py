# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models

class PosConfig(models.Model):
    _inherit = 'pos.config'

#kitchen screen boolean for opening kitchen /recall screen in pos config
    kitchen_screen = fields.Boolean(default=False)