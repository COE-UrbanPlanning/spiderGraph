import crossfilter from 'crossfilter';
//import L from 'leaflet';

//const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGVyc2h1IiwiYSI6ImNqOG5lc2tqMTFhOGoycW11cjBmaGdtZzYifQ.3p27c852PbAWhiFaJNHrsQ';

export default class DataFilter {
    get data() {
        return this._data;
    }
    
    loadJSON(filename) {
        return fetch(filename)
            .then(resp => resp.json())
            .then(data => {
                this._data = crossfilter(data.features);
                this.buildFilters();
            });
    }
    
    buildFilters() {
        this.filters = {}
        this.filters['name'] = this._data.dimension(d => d.properties.name);
    }
    
    filter(dim, filterText) {
        this.filters[dim].filterAll();
        this.filters[dim].filter(name => name.startsWith(filterText));
    }
}

//var map = window.map = L.map('map', {center: [53.541077, -113.492246], zoom: 11});
//L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
//    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
//    maxZoom: 18,
//    id: 'mapbox.dark',
//    accessToken: MAPBOX_TOKEN
//}).addTo(map);
