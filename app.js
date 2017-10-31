/* global window,document */
import React, {Component} from 'react';
import {render} from 'react-dom';
import MapGL from 'react-map-gl';
import {queue} from 'd3-queue';
import {json as requestJSON} from 'd3-request';

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
const DATA_URL = 'trips_district.csv';
const COORDS_URL = 'coords_district.json';

class Root extends Component {

  constructor(props) {
    super(props);
    
    this.filter = props.filter; 
    
    this.state = {
      viewport: {
        ...DeckGLOverlay.defaultViewport,
        width: window.innerWidth,
        height: window.innerHeight - 100
      },
      data: null,
      coords: props.coords,
      mousePosition: [0, 0]
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this._resize.bind(this));
    this.resetFilters();
    var nameInput = document.getElementById('name_input');
    name_input.addEventListener('input', (function(e) {
      this.filterMap('IncGrp', e.target.value);
    }).bind(this));
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
  
  filterMap(dim, filterText) {
    this.filter.filter(dim, filterText);
    this.draw();
  }

  resetFilters() {
    this.filter.reset();
    this.draw();
  }
  
  draw() {
    this.setState({
      data: this.filter.result
    });
  }
  
  render() {
    const {viewport, data, coords, mousePosition, mouseEntered} = this.state;
    
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
            data={data ? data : []}
            coords={coords}
            brushRadius={2500}
            opacity={0.3}
            strokeWidth={2}
            enableBrushing={true}
            mousePosition={mousePosition}
            mouseEntered={mouseEntered}
            onHover={this._onHover.bind(this)}
          />
        </MapGL>
      </div>
    );
  }
}

var filter = new DataFilter();
window.filter = filter;

queue()
  .defer(filter.loadData.bind(filter), DATA_URL)
  .defer(requestJSON, COORDS_URL)
  .await((error, data, coords) => {
    console.log('data loaded');
    
    render(<Root filter={filter}
             coords={coords}/>,
           document.body.appendChild(document.createElement('div')));
  });
