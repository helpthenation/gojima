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



var KitchenScreen = ScreenWidget.extend({
    template: 'KitchenScreen',
    // previous_screen: 'products',
    events: _.extend({}, ScreenWidget.prototype.events, {
        'click .kitchen_state_change': 'kitchen_change'
    }),
    start : function () {
          this._super();
          this.refresh_page();
    },
    refresh_page: function (){
      var self = this;
        setInterval(function() {
          self.renderElement();
        }, 100000);
    },
    renderElement: function(){
      // var self = this;
      this._super();
      var self = this;
      var linewidget;
      console.log("=======update render Element");
      rpc.query({
                model: 'pos.order',
                method: 'search_kitchen_state',
            }).then(function (result) {
                for(var i = 0; i < result.length; i++){
                    var line = result[i];
                    linewidget = $(QWeb.render('KitchenOrderline',{ 
                        widget:self,
                        line: line,
                    }));
                    linewidget.data('id',line);
                    self.$('.line_kitchen').append(linewidget);
                }
            });
      // this.$('.back').click(function(){
      //       self.gui.show_screen(self.previous_screen);
      //   });
      this.$('.next').click(function(){
            self.gui.show_screen('RecallScreen');
        });
      
    },
    
    kitchen_change : function (ev) {
         var $input = $(ev.target),
             cid = $input.attr('data-id');
         rpc.query({
                    model: 'pos.order',
                    method: 'move_next',
                    args: [parseInt(cid, 10)],
                })              
         this.renderElement();
         this.getParent().screens.RecallScreen.renderElement();      
    },
});

gui.define_screen({
    'name': 'kitchenscreen', 
    'widget': KitchenScreen,
    // 'condition': function(){
    //     return this.pos.config.kitchen_screen;
    // },
    
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
        this._super();
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