# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, tools

class AccountJournal(models.Model):
	_inherit = 'account.journal'

	is_rounding_journal = fields.Boolean('Is Rounding Journal')
	use_rounding_journal = fields.Boolean('Use Rounding Journal')