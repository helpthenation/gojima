# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, tools


class GojimaPosConfig(models.Model):
    _inherit = "pos.config"
