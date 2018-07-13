# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.


{
    'name': 'Multi Salesman - Gojima',
    'version': '1.1',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Restaurant ',
    'description': """
""",
    'depends': ['point_of_sale'],
    'website': 'https://www.odoo.com/page/point-of-sale',
    'data': [
        'views/partner_view.xml',
        'views/assets.xml',
        
    ],
    'qweb': [
       'static/src/xml/pos_salesman.xml',
    ],
    'demo': [
        
    ],
    'installable': True,
    'auto_install': False,
}
