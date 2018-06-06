odoo.define('sort_orderlines.category', function (require) {
	
	var screens = require('point_of_sale.screens');
	
	screens.OrderWidget.include({
	    render_orderline: function(orderline){
	        var self = this;
	        el_node = this._super(orderline);
	        console.log('orderline ', orderline);
	        $(el_node).attr('data-id',orderline.id);

			// $(el_node).addClass('ui-state-default');
			// $( ".orderlines" ).sortable();
			// $( ".orderlines" ).disableSelection();
	        return el_node;
	    },
	});

	screens.ActionpadWidget.include({
	    renderElement: function(){
	    	var self = this;
	        this._super();
        	this.$('.pay').click(function(){
        		var order = self.pos.get_order();
        		var dom_id_order = [];
        		var lines_categ = [];
        		_.each($('.orderlines').children('li.orderline'), function(oline){
        			var oline_id = $(oline).data('id');
        			var oline_i = order.get_orderline(oline_id);
        			console.log('oline_i ', oline_i, oline_i.product.categ_id[0]);
        			// debugger;
        			if (lines_categ[oline_i.product.pos_categ_id] === undefined){
        				lines_categ[oline_i.product.pos_categ_id] = [];
        			}
        			lines_categ[oline_i.product.pos_categ_id].push(oline_id);
        			dom_id_order.push($(oline).data('id'));
        		})
        		_.each(lines_categ, function(categ_id, oline_id){
        			
        		});
        		console.log('lines_categ ', lines_categ);
        		var new_olines = [];
        		_.each(dom_id_order, function(domid){
        			new_olines.push(order.get_orderline(domid));
        		})
        		order.orderlines.models = new_olines;
        	});
	    },
	});

});