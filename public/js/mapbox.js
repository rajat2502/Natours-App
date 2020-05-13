/* eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoicmFqYXQyNTAyIiwiYSI6ImNrYTVucTByZzAxd3EzZ3BlOHM3NTNpZnIifQ.SDPaKqqruSos_HGhr22sQA';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/rajat2502/cka5o9wlb1an11isgk8f7xafa',
  scrollZoom: false,
  //   center: [-118.250402, 34.04975],
  //   zoom: 10,
  //   interactive: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // Create a "marker"
  const el = document.createElement('div');
  el.className = 'marker';

  //   Add marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add Popup
  new mapboxgl.Popup({
    offset: 30,
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Extends the map bounds to include the current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});
