/* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */
odoo.define('pos_session_report_analysis.pos_session_report_analysis',function(require){
    "use strict"
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var models = require('point_of_sale.models');
    var core = require('web.core');
    var QWeb = core.qweb;
    var rpc = require('web.rpc');
    var _t = core._t;

    var SessionReportButtonWidget = screens.ActionButtonWidget.extend({
        template: 'SessionReportButtonWidget',
        button_click: function() {
            var self = this;
            var session_id = self.pos.pos_session.id;
            if(session_id){
                if(self.pos.config.iface_print_via_proxy){
                    rpc.query({
                        model:'pos.session',
                        method:'get_session_report_data',
                        args: [{ 'session_id': session_id }]
                    })
                    .then(function(result){
                       if(result){
                            var company = {
                                email: self.pos.company.email,
                                website: self.pos.company.website,
                                company_registry: self.pos.company.company_registry,
                                contact_address: self.pos.company.partner_id[1],
                                vat: self.pos.company.vat,
                                phone: self.pos.company.phone,
                                name: self.pos.company.name,
                                logo:  self.pos.company_logo_base64,
                            }
                            result['company'] = company;
                            result['widget'] = self;
                            var receipt = QWeb.render('SessionXmlReceipt', result);
                            self.pos.proxy.print_receipt(receipt);
                       }
                        
                    });
                }
                else{
                    setTimeout(function(){
                        self.chrome.do_action('pos_session_report_analysis.action_wk_report_pos_session_summary',{additional_context:{ 
                            active_ids:[session_id],
                        }})
                        .fail(function(err){
                            self.gui.show_popup('error',{
                                'title': _t('The report could not be printed'),
                                'body': _t('Check your internet connection and try again.'),
                            });
                        });
                    },500)
                }

            }
           
        },
        generate_wrapped_product_name: function(name) {
			var MAX_LENGTH =24;
			var wrapped = [];
			var name = name;
			var current_line = "";
	
			while (name.length > 0) {
				var space_index = name.indexOf(" ");
	
				if (space_index === -1) {
					space_index = name.length;
				}
	
				if (current_line.length + space_index > MAX_LENGTH) {
					if (current_line.length) {
						wrapped.push(current_line);
					}
					current_line = "";
				}
	
				current_line += name.slice(0, space_index + 1);
				name = name.slice(space_index + 1);
			}
	
			if (current_line.length) {
				wrapped.push(current_line);
			}
	
			return wrapped;
		},
    });


    screens.define_action_button({
        'name': 'Session Summary',
        'widget': SessionReportButtonWidget,
        'condition': function() {
            if(this.pos.config && this.pos.config.wk_print_session_summary)
                return this.pos.config.wk_print_session_summary;
            else
                return false
        },
    });
});