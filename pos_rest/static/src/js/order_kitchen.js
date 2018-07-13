odoo.define('pos_rest.order_kitchen', function(require) {
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
    start: function() {
      this._super();
      this.renderElement();
      this.refresh_page();
    },
    refresh_page: function() {
      var self = this;
      setInterval(function() {
        self.renderSingleElement();
      }, 8000);
      setInterval(function() {
        self.color_change();
      }, 5000);
    },
    color_change: function() {
      for (var i = arr.length; i >= 0; i--) {
        if (arr[i]) {
          var $kc = self.$('.kitchen_state_change[data-id="' + arr[i] + '"]').parent();
          var time = $kc.find('#duration').text();
          var currentDate = new Date();
          var difference = moment(currentDate).diff(moment(time,"YYYY-MM-DD HH:mm:ss"));
          var duration = Math.floor(difference / 60000);
          $kc.find('#timer').html($('<span>' + moment.utc(difference).format("HH:mm:ss") + '</span>'));
          $kc.css("background-color", "white");
          if (duration >= 7 && duration < 10) {
            $kc.css("background-color", "yellow");
          }
          if (duration >= 10) {
            $kc.css("background-color", "red");
          }
        }
      }
    },
    append_line_widget: function (result){
      var $linewidgets;
      for (var i = result.length - 1; i >= 0; i--) {
          var line = result[i];
          if (arr.indexOf(Object.keys(line)[0]) === -1) {
            arr.push(Object.keys(line)[0]);
            $linewidgets = $(QWeb.render('KitchenOrderline', {
              'widget': self,
              'line': line,
              'id': Object.keys(line)[0],
            }));
            $linewidgets.data('id', line);
            self.$('.line_kitchen').append($linewidgets);
          }
        }
    },
    renderSingleElement: function() {
      var self = this;
      rpc.query({
        model: 'pos.order',
        method: 'search_kitchen_state',
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
      
      rpc.query({
        model: 'pos.order',
        method: 'search_kitchen_state',
      }).then(function(result) {
        self.append_line_widget(result);   
      });
      this.$('.next').click(function() {
        self.gui.show_screen('RecallScreen');
      });
    },
    kitchen_change_visible: function(cid) {
      var self = this;
      self.$('.kitchen_state_change[data-id="' + cid + '"]').parent().removeClass('oe_hidden');
    },
    kitchen_change: function(ev) {
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
    template: 'KitchenOrderline',

  });

  

  screens.ReceiptScreenWidget.include({
    click_next: function() {
      this.getParent().screens.kitchenscreen.renderElement();
      this._super();
    },
  });

  chrome.Chrome.include({
    build_widgets: function() {
      this._super();
      if (this.pos.config.kitchen_screen) {
        this.gui.set_startup_screen('kitchenscreen');
        this.gui.set_default_screen('kitchenscreen');
      }
    },
  });

  return {
    // KitchenButton: KitchenButton,
    KitchenScreen: KitchenScreen,
    KitchenOrderline: KitchenOrderline,

  };



});