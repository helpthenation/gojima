# -*- coding: utf-8 -*
{
    'name': 'Pos Mrp Connection',
    'version': '11.0.0',
    'summary': """Mrp Connectivity with Pos""",
    'description': """Mrp Connectivity with Pos""",
    'author': 'Rohit srivastava',
    'company': 'Envertis Soln',
    'website': 'http://www.envertis.com',
    'category': 'Mrp',
    'depends': ['mrp','point_of_sale','stock'],
    'data': [
        'security/ir.model.access.csv',
        'views/product_view.xml',
        'views/pos_template.xml',
    ],
    'installable': True,
    'auto_install': False,
}
