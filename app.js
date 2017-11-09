/* global window,document */
import React, {Component} from 'react';
import {render} from 'react-dom';
import MapGL from 'react-map-gl';
import {queue} from 'd3-queue';
import {json as requestJSON} from 'd3-request';

import DeckGLOverlay from './components/deckgl-overlay.js';
import DataFilter from './components/filter.js';
import Controls from './components/controls.js';

import {json as requestJson} from 'd3-request';

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
const DATA_URL = './data/trips_nbhd.csv';
const COORDS_URL = './data/coords_nbhd.min.geojson';
const FILTERS_URL = './filters.json';

function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

class Root extends Component {

  constructor(props) {
    super(props);
    
    this.filter = props.filter; 
    this.filterMap = this.filterMap.bind(this);
    
    this.state = {
      viewport: {
        ...DeckGLOverlay.defaultViewport,
        width: window.innerWidth,
        height: window.innerHeight - 100
      },
      data: null,
      coords: props.coords,
      filterConfig: props.filterConfig,
      mousePosition: [0, 0]
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this._resize.bind(this));
    this.draw();
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

  _onMouseOver(e) {
    if (e.target.id === 'deckgl-overlay') {
      this.setState({mouseEntered: true});
    }
  }

  _onMouseOut() {
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
    const {viewport, data, coords, brushRadius, filterConfig, mousePosition, mouseEntered, hoveredObject: object} = this.state;
    
    return (
      <div onMouseMove={this._onMouseMove.bind(this)}
           onMouseOver={this._onMouseOver.bind(this)}
           onMouseOut={this._onMouseOut.bind(this)}>
        {this._renderTooltip()}
        <MapGL
          {...viewport}
          onViewportChange={this._onViewportChange.bind(this)}
          mapboxApiAccessToken={MAPBOX_TOKEN}>
          <DeckGLOverlay viewport={viewport}
            data={data ? data : []}
            coords={coords}
            feature={object}
            brushRadius={1000}
            opacity={0.3}
            strokeWidth={2}
            enableBrushing={true}
            mousePosition={mousePosition}
            mouseEntered={mouseEntered}
            onHover={this._onHover.bind(this)}
          />
        </MapGL>
        <Controls filters={filterConfig} handler={this.filterMap}/>
      </div>
    );
  }
}

var filter = new DataFilter();
window.filter = filter;

queue()
  .defer(filter.loadData.bind(filter), DATA_URL)
  .defer(requestJSON, COORDS_URL)
  .defer(requestJSON, FILTERS_URL)
  .await((error, data, coords, filters) => {
    if (!error) {
      console.log('data loaded');
    
      filters.forEach(f => {
        if (f.startValue) {
          filter.filter(f.filter, f.startValue);
        }
      });
    
      render(<Root filter={filter}
              filterConfig={filters}
              coords={coords}/>,
        document.getElementById("map"));
    } else {
      console.error(error);
    }
  });
