odoo.define('pceft_odoo_integration.pceft_integration', function(require) {
"use strict";

    var ajax = require('web.ajax');
    var screens = require('point_of_sale.screens');
    var _super_payment = screens.PaymentScreenWidget.prototype;
    var core = require('web.core');
    var _t = core._t;

    screens.PaymentScreenWidget.include({
        click_paymentmethods: function(id, callSuper=false) {
            if(callSuper === true || callSuper == 'success'){
              return this._super(id);
            }
            var self = this;
            var _super = self._super;
            var journals = self.pos.journals;
            var amount = self.pos.get_order().get_due();
            var is_creditcard_journal = _.find(journals, function(jnl){console.log(jnl);return jnl.id==id && jnl.is_creditcard_journal === true;});

            if(is_creditcard_journal){
  		        $.ajax('http://127.0.0.1:5000?'+amount+'&purchase').then(function(result) {
                  var result = JSON.parse(result)
                  console.log('result ', result, result['Response']);
                  if(result['Response']['ResponseStatus'] != "FALSE"){
                    arguments[0] = id;
                    var res = _super_payment.click_paymentmethods.apply(self, arguments, true);
                    return res;                    
                  } else{
                    self.gui.show_popup('error', {
                        'title': _t('Payment failed'),
                        'body': _t('Payment Failed for some reason.'),
                    });
                  }
  		        });
            } else {
              return self._super(id);
            }
        },
    });
});

// {"?xml":{"@version":"1.0"},"Response":{"TransactionID":"5c4fd49e-673","ResponseStatus":"FALSE","ResponseCode":"D3","ResponseText":"FALSE","TransactionAmount":"0.00","TransactionType":"purchase"}}
