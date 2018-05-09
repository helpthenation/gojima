odoo.define('pos_rest.order_recall', function (require) {
"use strict";

var core = require('web.core');
var screens = require('point_of_sale.screens');
var gui = require('point_of_sale.gui');
var ActionpadWidget = screens.ActionButtonWidget;
var ScreenWidget = screens.ScreenWidget;
var rpc = require('web.rpc');
var QWeb = core.qweb;
var PosBaseWidget = require('point_of_sale.BaseWidget');

var RecallScreen = ScreenWidget.extend({
    template: 'RecallScreen',
    previous_screen: 'products',
    events: _.extend({}, PosBaseWidget.prototype.events, {
        'click .recall_state_change': 'recall_change'
    }),
    renderElement: function(){
      var self = this;
      this._super();
      var self = this;
      var linewidget;
      rpc.query({
                model: 'pos.order',
                method: 'search_kitchen_recall_state',
            }).then(function (result) {
                for(var i = 0; i < result.length; i++){
                    var line = result[i];
                    linewidget = $(QWeb.render('RecallOrderLine',{ 
                        widget:self,
                        line: line,
                    }));
                    linewidget.data('id',line);
                    self.$('.line_recall').append(linewidget);
                }
            });
      // this.$('.back').click(function(){
      //       self.gui.show_screen(self.previous_screen);
      //   });
      this.$('.next').click(function(){
            self.gui.show_screen('kitchenscreen');
        });
      
    },
    recall_change : function (ev) {
         var $input = $(ev.target),
             cid = $input.attr('data-id');
             rpc.query({
                    model: 'pos.order',
                    method: 'move_back',
                    args: [parseInt(cid, 10)],
                }) 
            this.renderElement();
            this.getParent().screens.kitchenscreen.renderElement();
            // debugger;        
    },  
});

gui.define_screen({
    'name': 'RecallScreen', 
    'widget': RecallScreen,
    
});

var RecallOrderLine = PosBaseWidget.extend({
    template:'RecallOrderLine',
    

});

// var RecallButton = ActionpadWidget.extend({
//     template: 'RecallButton',
//     button_click: function(){
//     	this.gui.show_screen('RecallScreen'); 
//     },
// });
// screens.define_action_button({
//     'name': 'RecallButton',
//     'widget': RecallButton,
    
// });

return {
    // RecallButton: RecallButton,
    RecallOrderLine:RecallOrderLine,
    RecallScreen:RecallScreen,
    
};
});