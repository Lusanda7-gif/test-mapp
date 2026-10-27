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

// Builds popup text from every field in a feature
function popupFromProps(props) {
  var html = '';
  for (var key in props) {
    html += '<b>' + key + ':</b> ' + props[key] + '<br>';
  }
  return html;
}

// Loads one GeoJSON file, draws it, and adds it to the layer menu
function addLayer(file, label, options) {
  fetch('data/' + file)
    .then(res => res.json())
    .then(data => {
      var layer = L.geoJSON(data, options).addTo(map);
      layerControl.addOverlay(layer, label);
    });
}

// Campus boundary (outline only), and zoom to it
fetch('data/campus.geojson')
  .then(res => res.json())
  .then(data => {
    var campus = L.geoJSON(data, {
      style: { color: '#00695c', weight: 3, fillOpacity: 0 },
      onEachFeature: (feature, layer) => layer.bindPopup(popupFromProps(feature.properties))
    }).addTo(map);
    layerControl.addOverlay(campus, 'Campus boundary');
    map.fitBounds(campus.getBounds());
  });

// Buildings (polygons)
addLayer('footprints.geojson', 'Buildings', {
  style: { color: '#555', weight: 1, fillColor: '#90a4ae', fillOpacity: 0.5 },
  onEachFeature: (feature, layer) => layer.bindPopup(popupFromProps(feature.properties))
});

// Footpaths (lines)
addLayer('pathway.geojson', 'Footpaths', {
  style: { color: '#ef6c00', weight: 3 },
  onEachFeature: (feature, layer) => layer.bindPopup(popupFromProps(feature.properties))
});