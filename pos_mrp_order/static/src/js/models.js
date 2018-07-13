odoo.define('pos_mrp_order.models_mrp_order', function (require) {
"use strict";

var models = require('point_of_sale.models');
var pos_screens = require('point_of_sale.screens');
// var models = pos_model.PosModel.prototype.models;
var rpc = require('web.rpc');
var _super_posmodel = models.PosModel.prototype;

// for(var i=0; i<models.length; i++){
//     var model=models[i];
//         if(model.model === 'product.product'){
//             model.fields.push('used_in_mrp');
//         }
//     }

 models.PosModel = models.PosModel.extend({
        initialize: function(session, attributes) {
          var product_model = _.find(this.models, function(model) {
            return model.model === 'product.product';
          });
          product_model.fields.push('used_in_mrp');
          return _super_posmodel.initialize.call(this, session, attributes);
        },
      });

pos_screens.PaymentScreenWidget.include({
        validate_order: function(force_validation) {
            var self = this
            this._super(force_validation);
            var order = self.pos.get_order();
            var order_line = order.orderlines.models;
            var list_product = []
            // var due   = order.get_due();
            // if (due == 0)
            // {
                for (var i in order_line)
                {
                    if (order_line[i].product.used_in_mrp)
                    {
                        if (order_line[i].quantity>0)
                        {
                            var product_dict = {
                                'id': order_line[i].product.id,
                                'qty': order_line[i].quantity,
                                'product_tmpl_id': order_line[i].product.product_tmpl_id,
                                'pos_reference': order.name,
                                'uom_id': order_line[i].product.uom_id[0],
                            };
                        list_product.push(product_dict);
                        }

                    }
                }
                if (list_product.length)
                {
                rpc.query({
                    model: 'mrp.production',
                    method: 'create_mrp_from_pos',
                    args: [1,list_product],
                  })
                }
            // }

        },

    });
});
