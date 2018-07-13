# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import api, fields, models

class Pc(models.Model):
    _inherit = "pos.config"

    pos_user_id = fields.Many2one('res.users', 'Pos User')



