odoo.define('pos_salesman.pos', function (require) {
    "use strict";

    var gui = require('point_of_sale.gui');
    var models = require('point_of_sale.models');
    var _super_posmodel = models.PosModel.prototype;
    
    models.PosModel = models.PosModel.extend({
        initialize: function(session, attributes) {
          var partner_model = _.find(this.models, function(model) {
            return model.model === 'res.partner';
          });
          partner_model.fields.push('is_pos_salesman');
          return _super_posmodel.initialize.call(this, session, attributes);
        },
      });

    gui.Gui.include({
    	select_partner: function(options){
            options = options || {};
            var self = this;
            var def  = new $.Deferred();
    
            var list = [];
            for (var i = 0; i < this.pos.partners.length; i++) {
                var user = this.pos.partners[i];
                 if (user && user.is_pos_salesman) {
                    list.push({
                        'label': user.name,
                        'item':  user
                    });
                }
            }
    
            this.show_popup('selection',{
                'title': options.title || _t('Select Salesperson'),
                'list': list,
                'confirm': function(user){ def.resolve(user); },
                'cancel':  function(){ def.reject(); }
            });
    
            return def.then(function(user){
                // if (options.security && user !== options.current_user && user.pos_security_pin) {
                //     return self.ask_password(user.pos_security_pin).then(function(){
                //         return user;
                //     });
                // } else {
                    return user;
                // }
            });
        }
    });


});