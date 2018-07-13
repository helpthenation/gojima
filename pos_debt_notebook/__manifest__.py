# -*- coding: utf-8 -*-
{
    'name': 'POS Debt & Credit notebook',
    'summary': 'Comfortable sales for your regular customers. Debt payment method for POS',
    'category': 'Point Of Sale',
    'version': '4.2.0',

    "external_dependencies": {"python": [], "bin": []},
    'depends': [
        'point_of_sale',
        'base_groupby_extra',
    ],
    'data': [
        'data/product.xml',
        'views.xml',
        'views/pos_debt_report_view.xml',
        'data.xml',
        'security/ir.model.access.csv',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    "demo": [
    ],
    'installable': True,
    # 'uninstall_hook': 'pre_uninstall',
}
