odoo.define('pos_rounding.rounding', function(require) {
"use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            var journal_model = _.find(this.models, function(model){
                return model.model === 'account.journal';
            });
            journal_model.fields.push('is_rounding_journal');
            journal_model.fields.push('use_rounding_journal');
            return _super_posmodel.initialize.apply(this, arguments);
        },
    });

    screens.PaymentScreenWidget.include({
        click_paymentmethods : function(id, callSuper=false) {
            if(callSuper === true || callSuper == 'success'){
              return this._super(id);
            }
            var self = this;
            var _super = self._super;
            var journals = self.pos.journals;
            var cashregister = null;
            var roundingregister = null;
            var use_rounding_journal = _.find(journals, function(jnl){
            return jnl.id==id && jnl.use_rounding_journal === true;});

            if(use_rounding_journal){
               for ( var i = 0; i < this.pos.cashregisters.length; i++ ) {
                   if ( this.pos.cashregisters[i].journal_id[0] === id ){
                       cashregister = this.pos.cashregisters[i];
                       
                  }
                 // debugger;
                  if ( this.pos.cashregisters[i].journal_id[1] === 'Rounding (AUD)' ){
                       roundingregister = this.pos.cashregisters[i];
                       
                  }

              }
              // debugger;
              this.pos.get_order().add_paymentline( cashregister );
              this.pos.get_order().add_paymentline( roundingregister );
              this.reset_input();
              this.render_paymentlines();

            }else {
                return self._super(id);
            }
        },
    });

    
});