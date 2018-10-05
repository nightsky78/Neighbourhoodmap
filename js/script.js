// strict adherence to scoping
//'use strict'

// define global variables
let map;

// Create a blank array for all the markers.
let markers = [];
let myInfoWindows = [];
let lastMarker;

// define foursquare stuff
let base_url = 'https://api.foursquare.com/v2/venues/';
let client_id = 'client_id=X1SUCODMCGPQI40HJ3RPNRXGVJTWPBTRDKKDJKD3PAOHW2VH';
let client_secret = 'client_secret=DM324VPQYSTRISJ2VXR0YN4HIHEUOCGKB14FJW0HOPZZLQ2N&';
let version = 'v=20180907'


// define my locations for the app
let locations = [
    {
        // This is my former workplace
        title: 'BMW North America',
        foursquare_id: '4c3601b63849c9285c45bbb1',
        location: {lat: 41.028939, lng: -74.073731}
    },{
        // favorite lunchplace when working from home
        title: 'Japanese Restaurant',
        foursquare_id: '4af36ba8f964a52073ed21e3',
        location: {lat: 40.968581 , lng: -73.713282}
    },{
        // My kids favorite frozen Yogurt Place
        title: 'Frozen Yogurt',
        foursquare_id: '5434731e498e72e113988386',
        location: {lat: 40.985139 , lng: -73.684363}
    },{
        //Our church we miss very much
        title: 'Church',
        foursquare_id: '4bb8aa38cf2fc9b673b49f02',
        location: {lat: 41.034731, lng: -73.595249}
    },{
        title: 'Elevation Burger',
        foursquare_id: '4e877ca19a529d24b715fd1e',
        location: {lat: 41.002192, lng: -73.682003}
    },{
        // Where German MEN meet
        title: 'Ale house',
        foursquare_id: '4e90b01af79014e2cea2d506',
        location: {lat: 40.968737,  lng: -73.712291}
    }];

// initalizing the map
function initMap() {
    // create the styles.
    // Each feature style gets its own entry
    var styles = [
        {
            featureType: 'water',
            stylers: [
                {color: '#40e0d0'} // light blue
                ]
        },{
            featureType: 'administrative',
            elementType: 'label.text.stroke',
            stylers: [
                {color: '#2B292E'}, // anthracite
                {weight: 0.5 } // line thickness of text
            ]
        }
    ]

    map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.979766, lng: -73.828107},
    zoom: 10,
    // add the styles to the map
    styles: styles
});

ko.applyBindings(new ViewModel());

}

// Gracefully handle any map error
var googleMapsError = function()  {
    alert('An error occurred with Google Maps!');
}


function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// This is the object defining the location to be displayed on the map and in list.
// It is called when filtering the data and each individual location from the filer
// result is passed.
var Location = function (myLocation) {
    var that = this;

    this.largeInfoWindow = new google.maps.InfoWindow();

    // defining the title of the location to make
    this.title = myLocation.title;
    this.fs_id = myLocation.foursquare_id;

    // create custom style for my markers by calling my function makeMarkerIcon and passing in a color.
    var defaultIcon = makeMarkerIcon('0091FF');
    var highlightedIcon = makeMarkerIcon('FFFF24');

    // create the bounds
    var bounds = new google.maps.LatLngBounds();

    // create marker
    // get the title and the position from the local array
    var position = myLocation.location;

    var title = myLocation.title;


    // Create a marker for location
    this.marker = new google.maps.Marker({
        position : position,
        map : map,
        title: title,
        icon: defaultIcon, // This is the default ICON from above with the special properties
        animation: google.maps.Animation.DROP,
        });

    // append the marker in the predefined markers array
    markers.push(this.marker);

    //extend the bounds of the view area of the map using the bounds extend function
    bounds.extend(this.marker.position);

    // Create event listener for each marker
    // passing in the marker, which is "this"
    // and populate the Info Window specific to that marker.
    // large Info Window is created below.
    this.marker.addListener('click', function(){
        populateInfoWindow(that.fs_id, this, that.largeInfoWindow);
    });

    // adding the event listener to change the marker Icon back and forth based on the mouse
    this.marker.addListener('mouseover', function(){
        this.setIcon(highlightedIcon);
    });
    this.marker.addListener('mouseout', function(){
        this.setIcon(defaultIcon);
    });

    // fit the maps to the bounds does not work here as the
    // bounds are defined based on the last loction.
    // Need to check how this can work.
    //map.fitBounds(bounds);
}


var ViewModel = function(){
    // create nwe location object passing the filtered values
    // put the markers on the map
    // storing the current context in the that variable. so we dont get confused
    // with using the differnt context in the html using the with variable.
    var that = this;

    this.locationList = ko.observableArray([]);

    locations.forEach(function(Item) {
        that.locationList.push(new Location(Item));
    });

    // Now I want to create my filter
    // first thing is to define my search term
    this.searchterm = ko.observable('');


    // Now I have to modify my location Array using the filter functions.
    // What I want to display is the filtered list bound in the html.
    this.filteredLocationList = ko.computed(function(){
        // first thing is to convert the input to lowercase as I want to search not case sensitive
        var searchTermLow = that.searchterm().toLowerCase();
        // Check if search filter is there
        if (searchTermLow) {
            // use the ko utility ot filter an array and return it as the computed value
            return ko.utils.arrayFilter(that.locationList(), function(item) {
                // make the name lower case
                var nameLower = item.title.toLowerCase();
                // check on name whether the serach term is available
                var filtered = nameLower.includes(searchTermLow);
                item.marker.setVisible(filtered);
                // return the filtered array to the array filter function
				return filtered;
			});
        }
        // else return the unchanged list
        else {
          that.locationList().forEach(function(item){
            item.marker.setVisible(true)
          });
          return that.locationList();
        }
      }, that);

    this.setLocation = function (clickedLocation) {
        populateInfoWindow(clickedLocation.fs_id, clickedLocation.marker,
            clickedLocation.largeInfoWindow);
    }


}

function closeInfoWindows(){
     for (var i=0;i<myInfoWindows.length;i++) {
          // Close the windows in my array.
          myInfoWindows[i].close();
          // This is somehow needed to make the window reappear again.
          myInfoWindows[i].marker = null;
       };
}

function populateInfoWindow(fs_id, marker, infowindow) {
    // closing the old Infowindows.
    closeInfoWindows();

    // if there is already a bouncing marker stop it.
    if (lastMarker){
        toggleBounce(lastMarker);
    }

    // start bouncing the current marker
    toggleBounce(marker);

    // Check if infowindow is already open
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
              infowindow.marker = null;
        });

        // Create new StreetViewService Object
        var streetViewService = new google.maps.StreetViewService();
        // define a radius to place the viewpoint where imagery exists.
        var radius = 50;

        let venue = getFSContent(fs_id);

        // define the getstreetview function to get the image and add it to the content of the marker.
        function getStreetView(data, status){
            if (status == google.maps.StreetViewStatus.OK){
                // position of the street view image
                var nearStreetViewLocation = data.location.latLng;
                //calculate the heading from the nearStreetViewLocation to the marker position.
                // needs the geometry library
                var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position)
                    // find the right image and add content
                   // Set content to the streetview image of the location
                // debug entry
                infowindow.setContent('<div style="color: black">' + venue[0]
                                + '</div><div id="pano"></div>'
                                + '<br><div style="color: black">' + venue[1] + '</div>'
                                + '<br><a href="' + venue[2] + '" style="color: black">'
                                + venue[2] + '</a>');
                // set panoramaoption
                // the size is determined by the CSS stile of pano
                var panoramaOptions = {
                position: nearStreetViewLocation,
                pov: {
                    heading: heading,
                    pitch: 10
                }
                };
                // create panorama object and put it inside the infowindow at the id of the pano
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent('<div style="color: red"> No Stree View Found</div>')
            };
        };


        // Call the streetviewservice function to get the panorama in a certain radius for position.
        // it passes the marker position the radius an get getStreetView as callback.
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

        // open the infowindow on the marker.
        myInfoWindows = [infowindow];
        lastMarker = marker;
        infowindow.open(map, marker);

    }


}


function getFSContent(fs_id) {
    var text;
    var response;
    var url = base_url + fs_id + '?' + client_id + '&' + client_secret + '&' + version;
    var result;

    $.ajax({ type: "GET",
         url: url,
         async: true,
         dataType: 'json',
         success : function(text)
         {
             response = text;

         }
    }).fail(function(errorText) {
        alert('Foursquare data not available!');

    });

    // Store the relevant data in a array and return it
    if (result){
    let venueArray = [response.response.venue.name,
                    response.response.venue.location.formattedAddress,
                    response.response.venue.url]
    return venueArray;
    } else {
        return ['N/A','N/A', 'N/A']
    }
}

function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}





