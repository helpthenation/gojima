odoo.define('pos_receipt.multiprint', function (require) {
"use strict";

var models = require('point_of_sale.models');
var core = require('web.core');
var QWeb = core.qweb;

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
  computeChanges: function(categories){
    var json = this.export_as_JSON();
        var current_res = this.build_line_resume();
        var old_res     = this.saved_resume || {};
        // var json        = this.export_as_JSON();
        var add = [];
        var rem = [];
        var line_hash;

        for ( line_hash in current_res) {
            var curr = current_res[line_hash];
            var old  = old_res[line_hash];

            if (typeof old === 'undefined') {
                add.push({
                    'id':       curr.product_id,
                    'name':     this.pos.db.get_product_by_id(curr.product_id).display_name,
                    'name_wrapped': curr.product_name_wrapped,
                    'note':     curr.note,
                    'qty':      curr.qty,
                });
            } else if (old.qty < curr.qty) {
                add.push({
                    'id':       curr.product_id,
                    'name':     this.pos.db.get_product_by_id(curr.product_id).display_name,
                    'name_wrapped': curr.product_name_wrapped,
                    'note':     curr.note,
                    'qty':      curr.qty - old.qty,
                });
            } else if (old.qty > curr.qty) {
                rem.push({
                    'id':       curr.product_id,
                    'name':     this.pos.db.get_product_by_id(curr.product_id).display_name,
                    'name_wrapped': curr.product_name_wrapped,
                    'note':     curr.note,
                    'qty':      old.qty - curr.qty,
                });
            }
        }

        for (line_hash in old_res) {
            if (typeof current_res[line_hash] === 'undefined') {
                var old = old_res[line_hash];
                rem.push({
                    'id':       old.product_id,
                    'name':     this.pos.db.get_product_by_id(old.product_id).display_name,
                    'name_wrapped': old.product_name_wrapped,
                    'note':     old.note,
                    'qty':      old.qty, 
                });
            }
        }

        if(categories && categories.length > 0){
            // filter the added and removed orders to only contains
            // products that belong to one of the categories supplied as a parameter

            var self = this;

            var _add = [];
            var _rem = [];
            
            for(var i = 0; i < add.length; i++){
                if(self.pos.db.is_product_in_category(categories,add[i].id)){
                    _add.push(add[i]);
                }
            }
            add = _add;

            for(var i = 0; i < rem.length; i++){
                if(self.pos.db.is_product_in_category(categories,rem[i].id)){
                    _rem.push(rem[i]);
                }
            }
            rem = _rem;
        }

        // var d = new Date();
        // var hours   = '' + d.getHours();
        //     hours   = hours.length < 2 ? ('0' + hours) : hours;
        // var minutes = '' + d.getMinutes();
        //     minutes = minutes.length < 2 ? ('0' + minutes) : minutes;
        
        return {
            'orderlines': json.lines,
            'customer_table': json.customer_table || false,
            'new': add,
            'cancelled': rem,
            'table': json.table || false,
            'floor': json.floor || false,
            'name': json.name  || 'unknown order',
            // 'customer_table': json.customer_table || false,
            // 'time': {
            //     'hours':   hours,
            //     'minutes': minutes,
            // },
        };
        
    },
  printChanges: function(){
        var printers = this.pos.printers;
        for(var i = 0; i < printers.length; i++){
            var changes = this.computeChanges(printers[i].config.product_categories_ids);
            if ( changes['new'].length > 0 || changes['cancelled'].length > 0){
                var receipt = QWeb.render('OrderChangeReceipt',{changes:changes, widget:this});
                printers[i].print(receipt);
            }
        }
    },
    });
});