odoo.define("merge_products_pos.products", function(require) {
  "use strict";
  var pos_screen = require('point_of_sale.screens');
  


  pos_screen.ProductScreenWidget.include({
    click_product: function(product) {
      if (product.to_weight && this.pos.config.iface_electronic_scale) {
        this.gui.show_screen('scale', {
          product: product
        });
      } else {
        var self = this;
        var order = self.pos.get_order();
        var lines = order.orderlines.models;
        var flag = false;
        for (var i in lines) {
          if (!lines[i].product.visibility_in_pos) {
            if (lines[i].product.display_name == product.display_name) {
              var qty = lines[i].get_quantity();
              lines[i].set_quantity(qty + 1);
              flag = true;
            }
          }
          if (lines[i].product.visibility_in_pos) {
            var to_merge_orderline;
            for (var j = parseInt(i) + 1; j < lines.length; j++) {
              if (JSON.stringify(lines[i].product.display_name) === JSON.stringify(lines[j].product.display_name) &&
                JSON.stringify(lines[i].extra_notes) === JSON.stringify(lines[j].extra_notes)) {
                to_merge_orderline = lines[i];
              }
              if (to_merge_orderline) {
                to_merge_orderline.merge(lines[j]);
                order.remove_orderline(lines[j])
              }
            }
          }
        }
        if (!flag) {
          order.add_product(product);
        }
      }
    },
  });

  pos_screen.ActionpadWidget.include({
    renderElement: function() {
              var self = this;
              this._super();
              this.$('.pay').off('click');
              this.$('.pay').click(function(){
            var order = self.pos.get_order();
            var lines = order.orderlines.models;
            var flag = false;
            for (var i in lines) {
                if (lines[i].product.visibility_in_pos) {
                    var to_merge_orderline;
                    for (var j = parseInt(i) + 1; j < lines.length; j++) {
                      if (JSON.stringify(lines[i].product.display_name) === JSON.stringify(lines[j].product.display_name) &&
                        JSON.stringify(lines[i].extra_notes) === JSON.stringify(lines[j].extra_notes)) {
                        to_merge_orderline = lines[i];
                      if (to_merge_orderline) {
                        to_merge_orderline.merge(lines[j]);
                        order.remove_orderline(lines[j])
                      }
                      }
                    }
                  }
                }
            var has_valid_product_lot = _.every(order.orderlines.models, function(line){
                return line.has_valid_product_lot();
            });
            if(!has_valid_product_lot){
                self.gui.show_popup('confirm',{
                    'title': _t('Empty Serial/Lot Number'),
                    'body':  _t('One or more product(s) required serial/lot number.'),
                    confirm: function(){
                        self.gui.show_screen('payment');
                    },
                });
            }else{
                self.gui.show_screen('payment');
            }
        });
        }
    });

});