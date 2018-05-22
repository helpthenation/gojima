odoo.define('pos_rest.order_kitchen', function (require) {
"use strict";

var core = require('web.core');
var screens = require('point_of_sale.screens');
var gui = require('point_of_sale.gui');
var ActionpadWidget = screens.ActionButtonWidget;
var ScreenWidget = screens.ScreenWidget;
var rpc = require('web.rpc');
var QWeb = core.qweb;
var PosBaseWidget = require('point_of_sale.BaseWidget');
var chrome = require('point_of_sale.chrome');
var ajax = require('web.ajax');
var time = require('web.time');
var arr = [];


var KitchenScreen = ScreenWidget.extend({
    template: 'KitchenScreen',
    // previous_screen: 'products',
    events: _.extend({}, ScreenWidget.prototype.events, {
        'click .kitchen_state_change': 'kitchen_change'
    }),
    start : function () {
          this._super();    
          this.renderElement();
          this.refresh_page();
    },
    refresh_page: function (){
      var self = this;
        setInterval(function() {
          self.xyz();
        }, 1000);
    },
    xyz: function(){
      
      var self = this;
      rpc.query({
                model: 'pos.order',
                method: 'search_kitchen_state',
            }).then(function (result) {
              if (result !== undefined) {
               for(var i = result.length-1; i >= 0; i--){
                    var line = result[i];
                  if (line)
                  {
                   if(arr.indexOf(Object.keys(line)[0]) === -1){
                    var $linewidget = $(QWeb.render('KitchenOrderline',{ 
                        'widget':self,
                        'line': line,
                        'id': Object.keys(line)[0],
                    }));
                 arr.push(Object.keys(line)[0]);
                $linewidget.data('id',line);
                self.$('.line_kitchen').append($linewidget); 
               } 
              }  
             }
           }
             }
            );
    },
    renderElement: function(){
      // var self = this;
      this._super();
      var self = this;
      var linewidgets;
      rpc.query({
                model: 'pos.order',
                method: 'search_kitchen_state',
            }).then(function (result) {
                for(var i = result.length-1; i >= 0; i--){
                    var line = result[i];
                    if(arr.indexOf(Object.keys(line)[0]) === -1){
                      arr.push(Object.keys(line)[0]);
                    linewidgets = $(QWeb.render('KitchenOrderline',{ 
                        'widget':self,
                        'line': line,
                        'id': Object.keys(line)[0],
                    }));
                   linewidgets.data('id',line);
                   self.$('.line_kitchen').append(linewidgets);
                    } 
                }
            });
      this.$('.next').click(function(){
            self.gui.show_screen('RecallScreen');
        });
    },
    kitchen_change_visible: function (cid){
       var self = this;
         self.$('.kitchen_state_change[data-id="' + cid + '"]').parent().removeClass('oe_hidden');
    },
    kitchen_change : function (ev) {
         var $input = $(ev.target),
             cid = $input.attr('data-id');    
         rpc.query({
                    model: 'pos.order',
                    method: 'move_next',
                    args: [parseInt(cid, 10)],
                })

          $input.parent().addClass('oe_hidden');
          this.getParent().screens.RecallScreen.recall_change_visible(cid);        
    },
});

gui.define_screen({
    'name': 'kitchenscreen', 
    'widget': KitchenScreen, 
});



var KitchenOrderline = PosBaseWidget.extend({
    template:'KitchenOrderline',  
});

// var KitchenButton = ActionpadWidget.extend({
//     template: 'KitchenButton',
//     button_click: function(){
//     	this.gui.show_screen('kitchenscreen'); 
//     },
// });
// screens.define_action_button({
//     'name': 'KitchenButton',
//     'widget': KitchenButton,
    
// });

screens.ReceiptScreenWidget.include({
    click_next: function() {
        this.getParent().screens.kitchenscreen.renderElement();
        this._super();
        debugger;
    },
   });

chrome.Chrome.include({
    build_widgets: function(){
        this._super();
        if (this.pos.config.kitchen_screen) {
          this.gui.set_startup_screen('kitchenscreen');
          this.gui.set_default_screen('kitchenscreen');
        }
    },
});

return {
    // KitchenButton: KitchenButton,
    KitchenOrderline:KitchenOrderline,
    KitchenScreen:KitchenScreen,
    
};



});