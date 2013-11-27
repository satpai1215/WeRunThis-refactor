$(document).ready(function() {

	var Route = Backbone.Model.extend({
		defaults: {
			comments: "(no comments posted)",
			name: "(no route name entered)",
			user: "Anonymous",
			location: "San Francisco",
			routeMap: null
		}
	})
// route-show view
	var RouteView = Backbone.View.extend({
		events: {
			"click .add-route-btn" : "addNewRoute",
			"click #show-instructions-link" : "toggleInstructions",
			"click #clear-map-btn" : "clearMap",
			"click #recenter-map-btn" : "reCenterMap"
		},			
		addNewRoute: function(event) {
			event.preventDefault();

			if(this.validateUserInput()) {
				var id = app.routeList.length;
				var newMapObject = new RouteMap({id: id, drawnPaths: polylines.slice(), markers: markers.slice()});

				var comments = $('#comments-input').val(); 
				if (comments.length == 0) {
					comments = "(no comments posted by user)";
				}

		        var route = new Route({ name: $('#route-name-input').val(), user: $('#user-name-input').val(),
		        						 routeMap: newMapObject, id: id, location: $("#location-input").val(), 
		        							comments: comments});

		        app.routeList.create(route);

		        $("#notice").text("Your route was successfully added to the list.");
	        	$("#notice").fadeIn(1000).delay(3000).fadeOut(1000);

		        $('#route-name-input').val('');
		        $('#user-name-input').val('');
		        $('#comments-input').val('');
		        this.clearMap();
		    }
		    else {
		    	$("#notice").text("You must fill in all of the route information and there must be a route drawn on the map before submitting.");
	        	$("#notice").fadeIn(1000).delay(3000).fadeOut(1000);
		    }
		},
		clearMap: clearMap,
		reCenterMap: reCenterMap,
		render: function() {
			this.$el.html(this.templateMap());
			if(this.model.isNew()) {
				this.renderNew();
			}
			else {
				this.renderOld();
			}
			return this;
		},
		renderNew: function() {
			this.$el.prepend(this.templateGeocoder());
				this.$el.prepend(this.templateInstructions());
				this.$el.prepend("<h2>Draw New Route:</h2>");
				this.$el.append(this.templateNew());
				console.log('isNew');
		},
		renderOld: function() {
			console.log("old");
			var route = this.model;
			//show route name and user
			this.$el.prepend(this.template(route.toJSON()));
			this.$el.append(this.templateComments(route.toJSON()));
			console.log("old");
		},
		toggleInstructions: function() {
			$("#draw-instructions").toggleClass('hidden');
		},
		validateUserInput: function() {
			return ($('#route-name-input').val() && $('#user-name-input').val() && markers.length && polylines.length);
		},
		template: _.template($("#route-view-template").html()),
		templateComments: _.template($("#comments-template").html()),
		templateGeocoder: _.template($("#geocoder-template").html()),
		templateInstructions: _.template($("#draw-instructions-template").html()),
		templateMap: _.template($("#map-template").html()),
		templateNew: _.template($("#new-route-form").html())
	})
//route collection
	var RouteList = Backbone.Collection.extend({
		url: '#',
		localStorage: new Backbone.LocalStorage("werunthis-localstorage")
	})

//sidebar list-item
	var ListItem = Backbone.View.extend({
		tagName: "li",
		template: _.template($("#route-item-view-template").html()),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	})
//sidebar #route-list ul
	var ListView = Backbone.View.extend({
		initialize: function() {
			//this.collection.create(new Route({id: 0, name: "DeathRoute"}));
			//this.collection.create(new Route({id: 1, name: "PussyRoute"}));
			this.render();
			this.collection.on("add", this.render, this);
		},
		render: function() {
			$("#route-list").empty();
			this.collection.each(function(route) {
				var routeItemView = new ListItem({model: route});
				$("#route-list").append(routeItemView.render().el);
			});
			$("#route-list").append("<li><a href='#/new'>Add New Route</a></li>");
		}
	})

//router
	var AppRouter = Backbone.Router.extend({
		initialize: function() {
			this.routeList = new RouteList();
			this.routeList.fetch();
			this.routeListView = new ListView({collection: this.routeList});
			if(this.routeList.length > 0) {
				this.renderRouteView(0);
			}
			else {this.renderRouteView('new');}
		},
		routes: {
			":id" : "renderRouteView",
			"new" : "renderRouteView"
		},
		renderNewRouteForm: function() {

		},
		renderRouteView: function(id) {
			var routeView;
			var route = this.routeList.get(id);
			if(route == undefined || id == 'new') {
				routeView = new RouteView({model: new Route()});
				console.log('new');	
				$("#route-form").html(routeView.render().el);
				mapInitialize('map-canvas');	
				$('#clear-map-btn').css('display', 'inline-block');	
			}
			else {
				routeView = new RouteView({model: route});
				console.log('old');

				$("#route-form").html(routeView.render().el);
				
				//create mapObject for route
				var mapObject = route.get('routeMap');
				newMap('map-canvas', mapObject.get('drawnPaths'), mapObject.get('markers'));
			}
			
		}
	})

/********* MAPS MODELS AND VIEWS *********/

var RouteMap = Backbone.Model.extend({
	defaults: function() {
		return {
			drawnPaths: null,
			markers: null,
			id: null
		}
	}
});

var RouteMapView = Backbone.View.extend({
	className: "route-item-map",
	events: {},
	template: _.template("<div id = 'map-<%= id %>' class = 'map-canvas'></div>"),
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});

/********* MAPS FUNCTIONALITY *********/

var drawingManagerGlobal;
var polylines = [];
var markers = [];
var geocoder;
var map;

function mapInitialize(id) {
	geocoder = new google.maps.Geocoder();
	var mapOptions = {
	    zoom: 13,
	    center: new google.maps.LatLng(37.7833, -122.4167),
	    mapTypeId: google.maps.MapTypeId.ROADMAP,
	    mapTypeControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}
	  };
	map = new google.maps.Map(document.getElementById(id), mapOptions);
	  //console.log(map.controls);
	drawingManagerGlobal = new google.maps.drawing.DrawingManager({
		drawingMode: google.maps.drawing.OverlayType.POLYLINE,
		drawingControl: false,
		drawingControlOptions: {
		position: google.maps.ControlPosition.TOP_CENTER,
			drawingModes: [
				google.maps.drawing.OverlayType.POLYLINE,
				google.maps.drawing.OverlayType.MARKER
			]
		},
		polylineOptions: {
			editable: true,
			draggable: true,
			geodesic: true
		}
	});
		 
	drawingManagerGlobal.setMap(map);

  	google.maps.event.addListener(drawingManagerGlobal, 'polylinecomplete', function(pl) {
   
        if(polylines.length == 0) {
        	polylines.push(pl);
        	//put marker at starting point
        	startPoint = new google.maps.Marker({
				draggable: false,
				map: map,
				position: pl.getPath().getArray()[0],
				title: "Starting Point"
			});
			markers.push(startPoint);
			drawingManagerGlobal.setDrawingMode(null); //don't allow user to draw anymore after route is added
        } else {
        	pl.setMap(null);
        	$("#notice").text("You can only create one run path per route.  Please clear the previous path before adding another.");
        	$("#notice").fadeIn(1000).delay(3000).fadeOut(1000);
        }
  	});

	return map;
}

function newMap(id, paths, markers) {
	var mapOptions = {
	    zoom: 13,
	    center: markers[0].getPosition(),
	    mapTypeId: google.maps.MapTypeId.ROADMAP
	  };
	
	map = new google.maps.Map(document.getElementById(id), mapOptions);
	var savedRoute;
	paths.forEach(function(path) {
			savedRoute = new google.maps.Polyline({
			path: path.getPath(),
			editable: false,
			draggable: false,
			map: map
		});
	});
	markers.forEach(function(marker) {
			startPoint = new google.maps.Marker({
			draggable: false,
			map: map,
			position: marker.getPosition(),
			title: "Starting Point"
		});
	});

	return map;
}



function reCenterMap() {
  var location = $('#location-input').val();
  geocoder.geocode( { 'address': location}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);

    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function clearMap() {
	while(markers[0])
	{
		markers.pop().setMap(null);
	}
	while(polylines[0])
	{
		polylines.pop().setMap(null);
	}

	mapInitialize('map-canvas');
}


/********* END OF MAPS MODELS, VIEWS, COLLECTIONS *********/




	var app = new AppRouter();
	Backbone.history.start();






});