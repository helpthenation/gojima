odoo.define('pos_rest.kitchen', function(require) {
  "use strict";

  var core = require('web.core');
  var models = require('point_of_sale.models');
  var screens = require('point_of_sale.screens');
  var gui = require('point_of_sale.gui');
  var rpc = require('web.rpc');
  var posdb = require('point_of_sale.DB');
  var ActionpadWidget = screens.ActionpadWidget;
  var ProductScreenWidget = screens.ProductScreenWidget;
  var PopupWidget = require('point_of_sale.popups');
  var PaymentScreenWidget = screens.PaymentScreenWidget;
  var QWeb = core.qweb;

  var utils = require('web.utils');
  var round_di = utils.round_decimals;
  var round_pr = utils.round_precision;

  var _super_posmodel = models.PosModel.prototype;
  var _super_orderline = models.Orderline.prototype;
  var session = require('web.session');



  posdb.include({
    init: function(options) {
      this.extra_notes = [];
      this._super(options);
    },
  });

  models.load_models({
    model: 'pos.order',
    fields: ['kitchen_state', 'dine_in', 'takeaway'],
    loaded: function(self, kitchen_state) {
      self.kitchen_state = kitchen_state;
    },
  });

  models.load_models({
    model: 'pos.order.line',
    fields: ['extra_notes'],
    loaded: function(self, extra_notes) {
      self.extra_notes = extra_notes;
    },
  });



  models.Orderline = models.Orderline.extend({
    initialize: function(session, attributes) {
      this.extra_notes = [];
      this.extra_notes_string = '';
      this.category_selected = true;
      this.count = true;
      this.select = false;
      return _super_orderline.initialize.call(this, session, attributes);
    },
    export_as_JSON: function() {
      var json = _super_orderline.export_as_JSON.call(this);
      json.extra_notes = this.extra_notes || false;
      json.price_unit = this.get_unit_price() + this.get_sum_extra_notes();
      return json;
    },
    init_from_JSON: function(json) {
      _super_orderline.init_from_JSON.apply(this, arguments);
      this.extra_notes = json.extra_notes || false;
    },
    set_extra_notes: function(extra_notes) {
      this.extra_notes = extra_notes;
      this.trigger('change', this);
    },
    get_extra_notes: function() {
      return this.extra_notes;
    },
    get_sum_extra_notes: function() {
      var sum = 0,
        self = this,
        extra_notes = this.extra_notes;
      _.each(extra_notes, function(extra_note) {
        for (var key in extra_note) {
          if (extra_note.hasOwnProperty(key)) {
            sum += Number(extra_note[key][0].replace(/[^0-9\.-]+/g, ""));
          }
        }
      });
      return sum;
    },
    get_display_price: function() {
      if (this.pos.config.iface_tax_included === 'total') {
        return this.get_price_with_tax() + this.get_sum_extra_notes();
      } else {
        var price = this.get_base_price() + this.get_sum_extra_notes() * this.get_quantity();
        return price;
      }
    },
    get_category : function(){
        var product = this.product.pos_categ_id[1].split('/')[0];
        return (product ? this.product.pos_categ_id[1].split('/')[0] : undefined) || 'UnCategorised Product';
   },
   get_category_id: function(){
        var db = this.pos.db;
        var ancestors_ids = db.get_category_ancestors_ids(this.product.pos_categ_id[0])[1];
        return ancestors_ids;
   },
   set_selected_product: function(count){
            this.count = count;
            this.trigger('change',this);
   },
   set_selected_category: function(selected){

        this.category_selected = selected;
        this.trigger('change',this);
   },
   is_selected_product: function(){
        return this.count;
   },
   set_select: function(selected){
        this.select = selected;
        this.trigger('change',this);
   },
   is_select: function(){
        return this.select;

   },
   is_selected_category: function(){
        return this.category_selected;
   },
    compute_all: function(taxes, price_unit, quantity, currency_rounding, no_map_tax) {
      var self = this,
        list_taxes = [],
        currency_rounding_bak = currency_rounding;
      if (this.pos.company.tax_calculation_rounding_method == "round_globally") {
        currency_rounding = currency_rounding * 0.00001;
      }
      var price_unit_new = price_unit + this.get_sum_extra_notes();
      var total_excluded = round_pr(price_unit_new * quantity, currency_rounding);
      var total_included = total_excluded;
      var base = total_excluded;
      _(taxes).each(function(tax) {
        if (!no_map_tax) {
          tax = self._map_tax_fiscal_position(tax);
        }
        if (!tax) {
          return;
        }
        if (tax.amount_type === 'group') {
          var ret = self.compute_all(tax.children_tax_ids, price_unit_new, quantity, currency_rounding);
          total_excluded = ret.total_excluded;
          base = ret.total_excluded;
          total_included = ret.total_included;
          list_taxes = list_taxes.concat(ret.taxes);
        } else {
          var tax_amount = self._compute_all(tax, base, quantity);
          tax_amount = round_pr(tax_amount, currency_rounding);
          if (tax_amount) {
            if (tax.price_include) {
              total_excluded -= tax_amount;
              base -= tax_amount;
            } else {
              total_included += tax_amount;
            }
            if (tax.include_base_amount) {
              base += tax_amount;
            }
            var data = {
              id: tax.id,
              amount: tax_amount,
              name: tax.name,
            };
            list_taxes.push(data);
          }
        }
      });
      return {
        taxes: list_taxes,
        total_excluded: round_pr(total_excluded, currency_rounding_bak),
        total_included: round_pr(total_included, currency_rounding_bak)
      };
    },
  });

  models.PosModel = models.PosModel.extend({
    initialize: function(session, attributes) {
      var product_model = _.find(this.models, function(model) {
        return model.model === 'product.product';
      });
      product_model.fields.push('visibility_in_pos');
      return _super_posmodel.initialize.call(this, session, attributes);
    },
  });

  var _super_order = models.Order.prototype;
  models.Order = models.Order.extend({
    initialize: function() {
      this.dine_in = false;
      this.takeaway = false;
      return _super_order.initialize.apply(this, arguments);
    },
    init_from_JSON: function(json) {
      this.dine_in = json.dine_in;
      this.takeaway = json.takeaway;
      return _super_order.init_from_JSON.apply(this, arguments);
    },
    export_as_JSON: function() {
      var json = _super_order.export_as_JSON.call(this);
      json['dine_in'] = this.dine_in;
      json['takeaway'] = this.takeaway;
      return json;
    },
    set_dine_in_status: function(dine_in) {
      // this.assert_editable();
      this.dine_in = dine_in;
      this.trigger('change', this);
    },
    get_dine_in_status: function() {
      return this.dine_in;
    },
    set_takeaway_status: function(takeaway) {
      // this.assert_editable();
      this.takeaway = takeaway;
      this.trigger('change', this);
    },
    get_takeaway_status: function() {
      return this.takeaway;
    },
    show_extra_products: function() {
      var This = this;
      var order_line = this.get_selected_orderline();
      if (order_line && order_line.get_product().visibility_in_pos) {
        var product = order_line.get_product();
        rpc.query({
            model: 'product.extra',
            method: 'get_extra',
            args: [
              [product.id]
            ],
          })
          .then(function(backend_result) {
            if (backend_result) {
              This.pos.gui.show_popup('AddonsSelectionWidget', {
                'title': product.display_name,
                'multiple_name': backend_result,
                confirm: function() {
                  var arrayOfValues = [];
                  var $parents = this.$('input:checked').parent().parent().parent();
                  if ($parents) {
                    order_line.set_extra_notes(arrayOfValues);
                    _.each($parents, function(parent) {
                      var parent_tr = $(parent).children();
                      var myDictionary = new Object();
                      for (var i = 0; i < parent_tr.length; i++) {
                        var product = $.trim(parent_tr[0].textContent);
                        var price = $.trim(parent_tr[1].textContent);
                        var checked = parent_tr[2].children[0].children[0].getAttribute('data-item-index');
                        myDictionary[product] = new Array();
                        myDictionary[product].push(price);
                        myDictionary[product].push(checked);
                      }
                      arrayOfValues.push(myDictionary);
                      order_line.set_extra_notes(arrayOfValues);
                    });
                  }

                },
              });
              $('.popup').css({
                'width': '655px',
                'height': '769px'
              });
              $('.popup').find(".tab-content").eq(0).addClass("current");
              $('.popup').find(".tab-link").eq(0).addClass("tab_color");
              var get_extra_notes = order_line.get_extra_notes();
              if (get_extra_notes.length) {
                $('.popup').find('.wk_checked_question').each(function(index, el) {
                  var cid = $(el).attr('data-item-index');
                  var pack_line = get_extra_notes;
                  $.each(pack_line, function(index, dict) {
                    $.each(dict, function(index, value) {
                      if (value[1] === cid) {
                        $(el).prop('checked', true);
                      }
                    });
                  });
                });
              }

            }
          });
      }
    },
  });

  screens.OrderWidget.include({
    render_orderline: function(orderline) {
      var node = this._super(orderline);
      var line_extra = node.querySelector('.line-extra');
      if (line_extra) {
        line_extra.addEventListener('click', (function() {
          this.show_extra_product(orderline);
        }.bind(this)));
      }
      return node;
    },
    show_extra_product: function(orderline) {
      this.pos.get_order().select_orderline(orderline);
      var order = this.pos.get_order();
      order.show_extra_products();

    },
  });

  PaymentScreenWidget.include({
    renderElement: function() {
      var self = this;
      this._super();
      this.$('.js_check_dine').click(function() {
        self.click_check_dine();
      });
      this.$('.js_check_takeaway').click(function() {
        self.click_check_takeaway();
      });
    },
    click_check_takeaway: function() {
      var order = this.pos.get_order();
      order.set_takeaway_status(!order.get_takeaway_status());
      if (order.get_takeaway_status()) {
        this.$('.js_check_takeaway').addClass('highlight');

      } else {
        this.$('.js_check_takeaway').removeClass('highlight');

      }
    },
    click_check_dine: function() {
      var order = this.pos.get_order();
      order.set_dine_in_status(!order.get_dine_in_status());
      if (order.get_dine_in_status()) {
        this.$('.js_check_dine').addClass('highlight');

      } else {
        this.$('.js_check_dine').removeClass('highlight');

      }
    },
  });


  var AddonsSelectionWidget = PopupWidget.extend({
    template: 'AddonsSelectionWidget',
    back_screen: 'product',
    events: _.extend({}, PopupWidget.prototype.events, {
      'click .tab-link': 'tab_link'
    }),
    tab_link: function(ev) {
      var $input = $(ev.target),
        cid = $input.attr('data-id');
      $(".current").removeClass('current');
      $(cid).addClass('current');
      $(".tab_color").removeClass('tab_color');
      this.$('.tab-link[data-id="' + cid + '"]').addClass('tab_color');

    },
    close: function() {
      this._super();
    },
  });
  gui.define_popup({
    name: 'AddonsSelectionWidget',
    widget: AddonsSelectionWidget
  });

  return AddonsSelectionWidget;
});