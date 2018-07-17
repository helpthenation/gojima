# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Pos Rounding',
    'version': '1.0',
    'category': 'Point of Sale',
    'sequence': 7,
    'summary': 'Pos Rounding',
    'description': """
""",
    'depends': ['point_of_sale'],
    'data': [
        'data/datas.xml',
        'views/assets.xml',
        'views/account_journal.xml',
    ],
    'qweb': [],
    'demo': [],
    'installable': True,
    'auto_install': False,
}
