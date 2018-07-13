odoo.define('pos_salesman.saleperson', function(require) {
    "use strict";

    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');

    var QWeb = core.qweb;

    models.load_models({
        model: 'pos.order',
        fields: ['sale_person_id'],
        loaded: function(self, sale_person_id) {
            self.sale_person_id = sale_person_id;
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function() {
            this.sale_person_id = false;
            return _super_order.initialize.apply(this, arguments);
        },
        init_from_JSON: function(json) {
            this.sale_person_id = json.sale_person_id;
            return _super_order.init_from_JSON.apply(this, arguments);
        },
        export_as_JSON: function() {
            var json = _super_order.export_as_JSON.call(this);
            json['sale_person_id'] = this.sale_person_id;
            return json;
        },
        set_sale_person: function(sale_person_id) {
            this.sale_person_id = sale_person_id.id;
            this.trigger('change', this);
        },
        get_sale_person_name: function() {
            if (this.sale_person_id){
            return this.pos.db.get_partner_by_id(this.sale_person_id).name;
            }
             return false;
        },
        get_sale_person: function() {
            if (this.sale_person_id){
            return this.sale_person_id.id ;
        }
            return false;
        }
    });


    var SalesmanButton = screens.ActionButtonWidget.extend({
        template: 'SalesmanButton',
        init: function(parent, options) {
            options = options || {};
            this._super(parent, options);
        },
        renderElement: function() {
            var self = this;
            this._super();
            this.$el.click(function() {
                self.click_salesperson();
            });
        },
        get_name: function() {
            var self = this;
            var order = self.pos.get_order();
            var user = order.sale_person_id;
            if (user) {
                var partner = this.pos.db.get_partner_by_id(user);
                return partner.name;
            } else {
                return "Salesman";
            }
        },
        click_salesperson: function() {
            var self = this;
            var order = self.pos.get_order();
            this.gui.select_partner({
                'current_user': order.get_sale_person(),
                'title': ('Change Sales Person'),
            }).then(function(user) {
                order.set_sale_person(user);
                self.renderElement();
            });
        },
    });

    screens.define_action_button({
        'name': 'Salesman',
        'widget': SalesmanButton,
    });

});