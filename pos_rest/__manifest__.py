# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.


{
    'name': 'Restaurant - Gojima',
    'version': '1.2',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Restaurant ',
    'description': """
""",
    'depends': ['point_of_sale'],
    'website': 'https://www.odoo.com/page/point-of-sale',
    'data': [
        'security/ir.model.access.csv',
        'views/assets.xml',
        'views/product_extra.xml',
        'views/pos_kitchen.xml',
    ],
    'qweb': [
        'static/src/xml/custom_pos.xml',
        'static/src/xml/kitchen_screen.xml',
        'static/src/xml/recall_screen.xml',

    ],
    'demo': [
        
    ],
    'installable': True,
    'auto_install': False,
}
