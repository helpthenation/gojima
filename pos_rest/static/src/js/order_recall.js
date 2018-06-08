odoo.define('pos_rest.order_recall', function(require) {
  "use strict";

  var core = require('web.core');
  var screens = require('point_of_sale.screens');
  var gui = require('point_of_sale.gui');
  var ActionpadWidget = screens.ActionButtonWidget;
  var ScreenWidget = screens.ScreenWidget;
  var rpc = require('web.rpc');
  var QWeb = core.qweb;
  var PosBaseWidget = require('point_of_sale.BaseWidget');
  var recall_arr = [];

  var RecallScreen = ScreenWidget.extend({
    template: 'RecallScreen',
    previous_screen: 'products',
    events: _.extend({}, PosBaseWidget.prototype.events, {
      'click .recall_state_change': 'recall_change'
    }),
    start: function() {
      this._super();
      this.renderElement();
      this.refresh_page();
    },
    refresh_page: function() {
      var self = this;
      setInterval(function() {
        self.renderSingleElement();
      }, 3000);
    },
    append_line_widget: function (result){
      var $linewidget;
    for (var i = result.length - 1; i >= 0; i--) {
            var line = result[i];
            if (line) {
              if (recall_arr.indexOf(Object.keys(line)[0]) === -1) {
                var $linewidget = $(QWeb.render('RecallOrderLine', {
                  'widget': self,
                  'line': line,
                  'id': Object.keys(line)[0],
                }));
                recall_arr.push(Object.keys(line)[0]);
                $linewidget.data('id', line);
                self.$('.line_recall').append($linewidget);
              }
            }
          }
    },
    renderSingleElement: function() {
      var self = this;
      rpc.query({
        model: 'pos.order',
        method: 'search_kitchen_recall_state',
      }).then(function(result) {
        if (result !== undefined) {
          self.append_line_widget(result);
        }
      });
    },
    renderElement: function() {
      // var self = this;
      this._super();
      var self = this;
      var linewidgets;
      rpc.query({
        model: 'pos.order',
        method: 'search_kitchen_recall_state',
      }).then(function(result) {
        self.append_line_widget(result);
      });
      this.$('.next').click(function() {
        self.gui.show_screen('kitchenscreen');
      });
    },
    recall_change_visible: function(cid) {
      var self = this;
      self.$('.recall_state_change[data-id="' + cid + '"]').parent().removeClass('oe_hidden');
    },
    recall_change: function(ev) {
      var $input = $(ev.target),
        cid = $input.attr('data-id');
      rpc.query({
        model: 'pos.order',
        method: 'move_back',
        args: [parseInt(cid, 10)],
      })
      $input.parent().addClass('oe_hidden');
      this.getParent().screens.kitchenscreen.kitchen_change_visible(cid);
    },
  });

  gui.define_screen({
    'name': 'RecallScreen',
    'widget': RecallScreen,

  });

  var RecallOrderLine = PosBaseWidget.extend({
    template: 'RecallOrderLine',


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
    RecallOrderLine: RecallOrderLine,
    RecallScreen: RecallScreen,

  };
});