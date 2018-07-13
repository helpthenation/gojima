# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.


{
    'name': 'Point of Sale User Binding',
    'version': '11.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'user in Pos ',
    'depends': ['point_of_sale'],
    'data': [
        'security/security.xml',
        'views/pos_user_binding.xml'
    ],
    'qweb': [
        # 'static/src/xml/discount_templates.xml',
    ],
    'installable': True,
}
