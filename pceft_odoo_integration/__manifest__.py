# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'PCEFT Odoo Integration',
    'version': '1.0',
    'category': 'Point of Sale',
    'sequence': 7,
    'summary': 'PCEFT Integration with Odoo POS',
    'description': """
""",
    'depends': ['point_of_sale'],
    'data': [
        'data/datas.xml',
        'views/pceft_integration_views.xml',
    ],
    'qweb': [],
    'demo': [],
    'installable': True,
    'auto_install': False,
}
