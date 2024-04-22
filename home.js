document.addEventListener('DOMContentLoaded', function () {
    var customIcon = L.icon({
        iconUrl: 'https://i.ibb.co/kH2yGn7/MB-Logo.png',
        iconSize: [100, 100], // size of the icon
        iconAnchor: [50, 50], // point of the icon which will correspond to marker's location
        popupAnchor: [0, -10] // point from which the popup should open relative to the iconAnchor
    });

    var customIconTwo = L.icon({
        iconUrl: 'https://i.ibb.co/Wf559tf/MB-Live.png',
        iconSize: [70, 70], // size of the icon
        iconAnchor: [35, 35], // point of the icon which will correspond to marker's location
        popupAnchor: [0, -10] // point from which the popup should open relative to the iconAnchor
    });

    // Function to ask for location permission
    function askForUserLocationPermission() {
        var modal = document.getElementById("myModal");
        var allowBtn = document.getElementById("allowButton");
        var cancelBtn = document.getElementById("cancelButton");

        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then(function (permissionStatus) {
                if (permissionStatus.state === 'granted') {
                    locateUser(); // If permission is already granted, proceed with locating the user
                } else if (permissionStatus.state === 'prompt') {
                    // If permission is not yet determined, prompt the user for permission
                    modal.style.display = "block";

                    allowBtn.onclick = function () {
                        modal.style.display = "none";
                        navigator.geolocation.getCurrentPosition(locateUser, function (error) {
                            console.error('Error getting user location:', error.message);
                            alert('Error getting your location. Please make sure you allow location access.');
                        });
                    }

                    cancelBtn.onclick = function () {
                        modal.style.display = "none";
                        alert('Location access is denied. Please enable it in your device settings or click the icon on the top right side.');
                    }
                } else {
                    // Permission denied
                    alert('Location access is denied. Please enable it in your device settings or click the icon on the top right side.');
                }
            });
        } else {
            // For browsers not supporting navigator.permissions
            alert('Your browser does not support the Permissions API. Please make sure to allow location access.');
        }
    }

    // Call the function to ask for location permission when the document is loaded
    askForUserLocationPermission();

    var mapPannedToUserLocation = false;
    var userLocation; // Declare userLocation globally 

    function locateUser() {
        // Geolocation API
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function (position) {
                var userLat = position.coords.latitude;
                var userLng = position.coords.longitude;
                userLocation = L.latLng(userLat, userLng); // Assign userLocation

                // Remove previous marker if exists
                if (myLocationMarker) {
                    map.removeLayer(myLocationMarker);
                }

                // Add new marker
                myLocationMarker = L.marker(userLocation, { icon: customIconTwo, draggable: false }).addTo(map);
                myLocationMarker.bindPopup("<b>My Location</b>").openPopup();

                if (routingControl) {
                    routingControl.setWaypoints([
                        userLocation, // Update start point to user location
                        myDestinationMarker.getLatLng() // Keep the destination point
                    ]);
                }

                if (!mapPannedToUserLocation) {
                    // Pan to the user's location only if it's the first time and map is not being panned by the user
                    map.setView(userLocation, 14);
                    mapPannedToUserLocation = true;
                }

                if (circleMyLocation) {
                    map.removeLayer(circleMyLocation);
                }

                var circleOptions = {
                    color: '#020035', // Border color
                    fillColor: '#020035', // Fill color
                    fillOpacity: 0.3
                };

                // Create circle using userLocation as the center
                circleMyLocation = L.circle(userLocation, { radius: 20, ...circleOptions }).addTo(map);

                // Check if the user is outside the destination radius
                var circleRadius = userLocation.distanceTo(myDestinationMarker.getLatLng());

                if (circleRadius > circleMyLocation.getRadius() + 20) {
                    // Add vibration effect
                    if ('vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200]); // Vibrate pattern
                    }
                }

            }, function (error) {
                console.error('Error getting user location:', error.message);
                alert('Error getting your location. Please make sure you allow location access.');
            }, {
                enableHighAccuracy: true, // Request high accuracy
                timeout: 10000, // Timeout in milliseconds
                maximumAge: 0 // Maximum age of cached position
            });
        } else {
            // Geolocation not supported
            console.error('Geolocation is not supported by this browser.');
            alert('Geolocation is not supported by this browser.');
        }
    }

    // Map Initialization
    var map = L.map('map', {
        zoomControl: false // Disable zoom control
    }).setView([14.3990, 120.9777], 14);

    // Tile Layer
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    osm.addTo(map);

    // Variables Initialization
    var myLocationMarker;
    var myDestinationMarker;
    var fixedMarker;
    var routingControl;
    var circleMyLocation;

    // Search Control
    var searchControl = L.Control.geocoder({
        defaultMarkGeocode: false,
        collapsed: false,
        placeholder: 'Search...',
    }).on('markgeocode', function (e) {
        // Clear previous destination marker, if any
        if (myDestinationMarker) {
            map.removeLayer(myDestinationMarker);
        }
    
        // Get the coordinates of the searched location
        var latlng = e.geocode.center;
    
        // Set the view to the searched location with a zoom level of 14
        map.setView(latlng, 14);
    
        // Add a marker at the searched location
        myDestinationMarker = L.marker(latlng, { icon: customIcon, draggable: true }).addTo(map);
        myDestinationMarker.bindPopup("<b>My Destination (Drag to move)</b>").openPopup();
    
        // Event listener for marker drag
        myDestinationMarker.on('dragend', function (e) {
            var newLatLng = e.target.getLatLng();
            myDestinationMarker.setLatLng(newLatLng);
        });
    }).addTo(map);
    
    // Center the control
    var container = searchControl.getContainer();
    container.style.position = 'fixed';
    container.style.left = '50%';
    container.style.top = '2%';
    container.style.transform = 'translate(-50%, -50%)';

    function startButtonClicked() {
        // Check if a destination marker exists
        if (myDestinationMarker) {
            checkbtnStart();
        } else {
            // Show a message or handle the case where no destination is set
            console.log("Please set a destination before starting.");
        }
    }

    // Assuming there's a function checkbtnStart() that you want to call when the start button is clicked
    // You can replace this with your actual function call
    function checkbtnStart() {
        console.log("btnStart clicked!");
    }

    function clearRouting() {
        // Clear Routing Control
        if (routingControl) {
            map.removeControl(routingControl);
        }
    }

    // Event Listeners
    document.getElementById("btnLocate").addEventListener("click", function () {
        if (myLocationMarker) {
            // If myLocationMarker already exists, just zoom to it
            map.setView(myLocationMarker.getLatLng(), 14);
        } else {
            askForUserLocationPermission(); // Ask for user's location permission
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        // Your existing code here...
    
        // Add SOS Button Event Listener
        document.getElementById("btnSOS").addEventListener("click", function () {
            if (userLocation) {
                // If user location is available
                var message = "SOS Signal! Help needed at: Latitude " + userLocation.lat + ", Longitude " + userLocation.lng;
                if (navigator.share) {
                    navigator.share({
                        title: "SOS Signal",
                        text: message,
                        url: "https://www.google.com/maps?q=" + userLocation.lat + "," + userLocation.lng
                    })
                    .then(() => {
                        console.log("Location shared successfully.");
                    })
                    .catch((error) => {
                        console.error("Error sharing location:", error);
                        alert("Error sharing location. Please try again.");
                    });
                } else {
                    console.log("navigator.share API not supported.");
                    // If navigator.share API is not supported, you can display a message or provide an alternative method to share the location
                    alert("Sharing location is not supported in your browser. Please use a browser that supports sharing.");
                }
            } else {
                // If user location is not available
                alert("Error: User location not available.");
            }
        });
    });    

    document.getElementById("btnStart").addEventListener("click", function () {
        if (routingControl) {
            // Stop Button Functionality
            map.removeControl(routingControl);
            if (circle) {
                map.removeLayer(circle); // Remove the circle
                circle = null; // Reset circle variable
            }
            myDestinationMarker.dragging.enable();
            if (fixedMarker) {
                map.removeLayer(fixedMarker);
                fixedMarker = null;
            }
            document.getElementById("btnStart").innerHTML = '<i class="fas fa-play"></i>';
            routingControl = null;
        } else {
            // Start Button Functionality
            if (myLocationMarker && myDestinationMarker) {
                clearRouting();

                routingControl = L.Routing.control({
                    waypoints: [
                        myLocationMarker.getLatLng(),
                        myDestinationMarker.getLatLng()
                    ],
                    routeWhileDragging: false, // Disable dragging while routing
                    createMarker: function () { return null; }, // Disable creation of new markers
                    show: false, // Hide the route line initially
                    addWaypoints: false, // Prevent adding additional waypoints
                }).addTo(map);

                // Zoom to user location marker
                map.setView(myLocationMarker.getLatLng(), 15);

                // Draggable markers for route start and end points
                fixedMarker = L.layerGroup([L.marker(myDestinationMarker.getLatLng(), { icon: customIcon, draggable: false })]).addTo(map);
                fixedMarker.eachLayer(function (layer) {
                    layer.on('dragend', function (e) {
                        var newLatLng = e.target.getLatLng();
                        myDestinationMarker.setLatLng(newLatLng);
                    });
                });

                document.getElementById("btnStart").innerHTML = '<i class="fas fa-stop"></i>';

                // Add circle with radius extending from myDestinationMarker to myLocationMarker
                var circleOptions = {
                    color: '#d4af37',
                    fillColor: '#d4af37',
                    fillOpacity: 0.3
                };
                var circleRadius = myLocationMarker.getLatLng().distanceTo(myDestinationMarker.getLatLng());
                circle = L.circle(myDestinationMarker.getLatLng(), { radius: circleRadius, ...circleOptions }).addTo(map);
            }
            locateUser();
        }
    });
});
