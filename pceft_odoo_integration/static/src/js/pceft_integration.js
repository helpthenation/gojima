odoo.define('pceft_odoo_integration.pceft_integration', function(require) {
"use strict";

    var ajax = require('web.ajax');
    var screens = require('point_of_sale.screens');

    screens.PaymentScreenWidget.include({
        click_paymentmethods: function(id) {
            var self = this;
            var _super = this._super;
            var journals = self.pos.journals;
            var amount = self.pos.get_order().get_due();
            var is_creditcard_journal = _.find(journals, function(jnl){console.log(jnl);return jnl.is_creditcard_journal === true;});

            if(is_creditcard_journal){
                $.ajax('http://127.0.0.1:5000?'+amount+'&purchase').then(function(result){
                    console.log('result ', result);
                });
            }
            this._super(id);
        },
    });
});
