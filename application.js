var Route = Backbone.Model.extend({
	defaults: {
		name: '',
		user: 'Anonymous',
		location: null,
	},
	localStorage: new Backbone.LocalStorage("werunthis-localstorage")
})

var RouteView = Backbone.View.extend({
	events: {
		"click #add-route-btn" : "saveRoute"
	},
	saveRoute: function() {
		var route = new Route({name: $('route-name-input').text(), user: $('user-name-input').val()});
		this.model.set(route);
		//this.model.save();
	},
	template: _.template($('#new-route-form').text()),
	render: function() {
		this.$el.html(this.template());
		return this;
	}
})

var RouteItemView = Backbone.View.extend({
	tagName: 'li',
	template: _.template($('#route-template').text()),
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
})

var RouteList = Backbone.Collection.extend({
	model: Route,
	url:'../index.html',
	localStorage: new Backbone.LocalStorage("werunthis-localstorage")

})

var RouteListView = Backbone.View.extend({
	el: $("#route-list"),
	initialize: function() {
		//this.collection.on('add', this.addOne, this);
	},
	addRoute: function() {
		this.close();
	},
	render: function() {
		var view = this;
		this.collection.each(function(route) {
			var routeView = new RouteItemView({model: route});
			view.$el.append(routeView.render().el);
		});
		return this;
	},
	close: function() {
		console.log("test");
		this.$el.unbind();
		this.$el.remove();
	}


})

var HeaderView = Backbone.View.extend({
	events: {
		"click #new-route-btn" : "newRoute"
	},
	template: _.template($('#header-template').text()),
	newRoute: function() {
		$('body').html('');
		var form = new RouteView();
		$('body').append(form.render().$el);
	},
	render: function() {
		this.$el.html(this.template());
		return this;
	}
})

var AppRouter = Backbone.Router.extend({
	routes: {
	},
	initialize: function() {
		$('#header').html(new HeaderView().render().$el);
		this.createList();
	},
	createList: function() {
		var routeList = new RouteList();
		routeList.add(new Route({name: "DeathRoute"}));
		routeList.add(new Route({name: "PussyRoute"}));
		console.log(routeList);
		var routeListView = new RouteListView({collection: routeList});
		routeListView.render();
	}
})

$(function() {
	var app = new AppRouter();
	Backbone.history.start();
});