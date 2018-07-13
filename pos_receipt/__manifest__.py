# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.


{
    'name': 'Restaurant receipt',
    'version': '1.2',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Restaurant ',
    'description': """
""",
    'depends': ['pos_restaurant'],
    'website': 'https://www.odoo.com/page/point-of-sale',
    'data': [
        'views/assets.xml',
    ],
    'qweb': [
        'static/src/xml/pos_receipt.xml',
    ],
    'demo': [
        
    ],
    'installable': True,
    'auto_install': False,
}
