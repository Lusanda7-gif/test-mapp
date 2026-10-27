// Create the map inside <div id="map">, centred on Hatfield, zoom 16
var map = L.map('map').setView([-25.7545, 28.2314], 16);

// Add the OpenStreetMap background
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Layer menu (tick boxes) and a scale bar
var layerControl = L.control.layers({ 'OpenStreetMap': osm }, {}).addTo(map);
L.control.scale().addTo(map);

// Function used by the Reset view button
function resetView() {
  map.setView([-25.7545, 28.2314], 16);
}