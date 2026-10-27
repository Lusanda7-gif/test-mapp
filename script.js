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

// Bathrooms (points)
addLayer('bathroom.geojson', 'Bathrooms', {
  pointToLayer: (feature, latlng) =>
    L.circleMarker(latlng, { radius: 6, color: '#0d47a1', fillColor: '#1e88e5', fillOpacity: 0.9 }),
  onEachFeature: (feature, layer) => layer.bindPopup(popupFromProps(feature.properties))
});

// Eateries (points)
addLayer('eatery.geojson', 'Eateries', {
  pointToLayer: (feature, latlng) =>
    L.circleMarker(latlng, { radius: 6, color: '#4e342e', fillColor: '#8d6e63', fillOpacity: 0.9 }),
  onEachFeature: (feature, layer) => layer.bindPopup(popupFromProps(feature.properties))
});

// Same options for every traffic layer, only the colour changes
function trafficOptions(colour) {
  return {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, { radius: 7, color: colour, fillColor: colour, fillOpacity: 0.7 }),
    onEachFeature: (feature, layer) => layer.bindPopup(popupFromProps(feature.properties))
  };
}

// Three empty layers, filled when their files arrive
var trafficAM  = L.geoJSON(null, trafficOptions('#d81b60'));
var trafficMid = L.geoJSON(null, trafficOptions('#fdd835'));
var trafficPM  = L.geoJSON(null, trafficOptions('#6a1b9a'));

// Loads a file into an existing layer
function loadInto(layer, file) {
  fetch('data/' + file)
    .then(res => res.json())
    .then(data => layer.addData(data));
}

loadInto(trafficAM,  'traffic_am.geojson');
loadInto(trafficMid, 'traffic_mid.geojson');
loadInto(trafficPM,  'traffic_pm.geojson');

// Show morning traffic when the page opens
trafficAM.addTo(map);

// Radio-button menu: pick ONE time of day
L.control.layers(
  { 'Traffic AM': trafficAM, 'Traffic Mid': trafficMid, 'Traffic PM': trafficPM },
  null,
  { collapsed: false, position: 'topleft' }
).addTo(map);

// Legend
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
  var div = L.DomUtil.create('div', 'legend');
  div.innerHTML = `
    <h4>Map Legend</h4>
    <p><span class="square" style="background:#90a4ae"></span> Buildings</p>
    <p><span class="line"></span> Footpaths</p>
    <p><span class="dot" style="background:#1e88e5"></span> Bathrooms</p>
    <p><span class="dot" style="background:#8d6e63"></span> Eateries</p>
    <p><span class="dot" style="background:#d81b60"></span> Traffic AM</p>
    <p><span class="dot" style="background:#fdd835"></span> Traffic Mid</p>
    <p><span class="dot" style="background:#6a1b9a"></span> Traffic PM</p>
        <p><span class="dot" style="background:green"></span> Pod available</p>
    <p><span class="dot" style="background:red"></span> Pod occupied</p>
  `;
  return div;
};

legend.addTo(map);

// CampusSync pods
var pods = [
  { name: 'Study Pod 1',    type: 'Study',    lat: -25.7550, lng: 28.2300, available: true  },
  { name: 'Study Pod 2',    type: 'Study',    lat: -25.7540, lng: 28.2320, available: false },
  { name: 'Wellness Pod 1', type: 'Wellness', lat: -25.7548, lng: 28.2310, available: true  }
];

var podLayer = L.layerGroup().addTo(map);

pods.forEach(function (pod) {
  var colour = pod.available ? 'green' : 'red';

  var marker = L.circleMarker([pod.lat, pod.lng], {
    radius: 11, color: colour, fillColor: colour, fillOpacity: 0.9
  }).addTo(podLayer);

  marker.bindPopup('<b>' + pod.name + '</b><br>' + pod.type + ' pod<br>' +
                   (pod.available ? 'Available' : 'Occupied'));

  // Click a pod to flip it between available and occupied
  marker.on('click', function () {
    pod.available = !pod.available;
    var c = pod.available ? 'green' : 'red';
    marker.setStyle({ color: c, fillColor: c });
    marker.setPopupContent('<b>' + pod.name + '</b><br>' + pod.type + ' pod<br>' +
                           (pod.available ? 'Available' : 'Occupied'));
  });
});

layerControl.addOverlay(podLayer, 'Rest Pods');

