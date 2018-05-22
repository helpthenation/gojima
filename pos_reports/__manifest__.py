# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'POS Reports',
    'version': '1.0',
    'category': 'Point of Sale',
    'sequence': 7,
    'summary': 'Analysis reports of the Point of Sale ',
    'description': """
""",
    'depends': ['point_of_sale', 'base_groupby_extra'],
    'data': [
        'views/pos_report_views.xml',
    ],
    'qweb': [],
    'demo': [],
    'installable': True,
    'auto_install': False,
}
