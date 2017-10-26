/* global window,document */
import React, {Component} from 'react';
import {render} from 'react-dom';
import MapGL from 'react-map-gl';
import DeckGLOverlay from './deckgl-overlay.js';
import DataFilter from './filter.js';

// Set your mapbox token here
//const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGVyc2h1IiwiYSI6ImNqOG5lc2tqMTFhOGoycW11cjBmaGdtZzYifQ.3p27c852PbAWhiFaJNHrsQ';
const tooltipStyle = {
  position: 'absolute',
  padding: '4px',
  background: 'rgba(0, 0, 0, 0.8)',
  color: '#fff',
  maxWidth: '300px',
  fontSize: '10px',
  zIndex: 9,
  pointerEvents: 'none'
};

// Source data locations
const DATA_URL = 'trips_agg.csv';
const CENTROIDS_URL = 'coords.json';

class Root extends Component {

  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        ...DeckGLOverlay.defaultViewport,
        width: 500,
        height: 500
      },
      data: null,
      mousePosition: [0, 0]
    };
    
    this.filter = new DataFilter();
    window.filter = this.filter;
    
    this.filter.loadData(DATA_URL, CENTROIDS_URL, () => {
      console.log('data loaded');
      this.draw();
    });
  }

  componentDidMount() {
    window.addEventListener('resize', this._resize.bind(this));
    this._resize();
  }

  _resize() {
    this._onViewportChange({
      width: window.innerWidth,
      height: window.innerHeight - 100
    });
  }

  _onViewportChange(viewport) {
    this.setState({
      viewport: {...this.state.viewport, ...viewport}
    });
  }

  _onMouseMove(evt) {
    if (evt.nativeEvent) {
      this.setState({mousePosition: [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY]});
    }
  }

  _onMouseEnter() {
    this.setState({mouseEntered: true});
  }

  _onMouseLeave() {
    this.setState({mouseEntered: false});
  }

  _onHover({x, y, object}) {
    this.setState({x, y, hoveredObject: object});
  }

  _renderTooltip() {
    const {x, y, hoveredObject} = this.state;

    if (!hoveredObject) {
      return null;
    }

    return (
      <div style={{...tooltipStyle, left: x, top: y}}>
        <div>{hoveredObject.name}</div>
        <div>{`Net gain: ${hoveredObject.net}`}</div>
      </div>
    );
  }
  render() {
    const {viewport, data, mousePosition, mouseEntered} = this.state;

    if (!data) {
      return null;
    }

    return (
      <div onMouseMove={this._onMouseMove.bind(this)}
           onMouseEnter={this._onMouseEnter.bind(this)}
           onMouseLeave={this._onMouseLeave.bind(this)}>
        {this._renderTooltip()}
        <MapGL
          {...viewport}
          onViewportChange={this._onViewportChange.bind(this)}
          mapboxApiAccessToken={MAPBOX_TOKEN}>
          <DeckGLOverlay viewport={viewport}
            data={data}
            brushRadius={1000}
            opacity={0.7}
            strokeWidth={0.5}
            enableBrushing={true}
            mousePosition={mousePosition}
            mouseEntered={mouseEntered}
            onHover={this._onHover.bind(this)}
          />
        </MapGL>
      </div>
    );
  }
  
  filterMap(dim, filterText) {
    this.filter.filter(dim, filterText);
    this.setState({
      data: null
    });
    //polygons.clearLayers();
    var shapes = []
    this.draw();
    //filter.filters['name'].top(Infinity).forEach(function(feature) {
    //  var shape = feature.geometry.coordinates[0].map(coords => coords.slice().reverse());
    //  polygons.addLayer(L.polygon(shape, {color: 'blue', weight: 1}));
    //});
  }

  draw() {
    this.setState({
      data: this.filter.result
    });
  }
}

render(<Root />, document.getElementById("map"));

//filter.loadJSON('output.json').then(function() {
//    var nameInput = document.getElementById('name_input');
//    Root.filterMap('');
//    nameInput.oninput = function(e) { Root.filterMap(e.target.value); };
//});
