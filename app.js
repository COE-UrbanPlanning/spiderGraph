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

function getLayerData(data, coordsLookup) {
  
  if (!data) {
    return null;
  }
  
  const pairs = {};
  const targetDict = {};
  const arcs = [];
  const not_found = [];
  
  function processData(trip) {
    const source = trip['I'];
    const target = trip['J'];
    const count = Number(trip['count']);
    
    var error = false;
    if (!coordsLookup.hasOwnProperty(source)) {
      error = true;
      if (!not_found.includes(source)) {
        not_found.push(source);
      }
    }
    if (!coordsLookup.hasOwnProperty(target)) {
      error = true;
      if (!not_found.includes(target)) {
        not_found.push(target);
      }
    }
    if (error) {
      return;
    }
    
    const key = [source, target].sort((a, b) => Number(a) - Number(b));
    let gain = 0;
    let loss = 0;
    // detect reverse trip
    if (key[0] === source) {
      gain = count;
    } else {
      loss = -count;
    }
    
    let pair = pairs[[source, target]];
    if (!pairs[[source, target]]) {
      pairs[[source, target]] = {
        name: source,
        position: coordsLookup[source].properties.centroid,
        target: target,
        gain: gain,
        loss: loss
      };
    } else {
      pairs[[source, target]].gain += gain;
      pairs[[source, target]].loss += loss;
    }
    
    if (!targetDict[target]) {
      targetDict[target] = {
        name: target,
        position: coordsLookup[target].properties.centroid,
        gain: 0,
        loss: 0,
        net: 0
      };
    }
  }
  
  data.forEach(processData);
  
  Object.keys(pairs).forEach(pairKey => {
    const {name, position, target, gain, loss} = pairs[pairKey];
    const net = gain + loss;
    
    targetDict[target].gain += gain;
    targetDict[target].loss += loss;
    targetDict[target].net += net;
    
    arcs.push({
      sourceID: name,
      targetID: target,
      source: position,
      target: coordsLookup[target].properties.centroid,
      value: net
    });
  });
  
  if (not_found.length > 0) {
    console.warn('The following zones were omitted because their centroid coordinates were not found: ' + not_found.join(', '));
  }
  
  return {arcs, targetDict};
}

function getLayerDataCalculator(lookup) {
  return function(data) {
    return getLayerData(data, lookup);
  }
}

function createCoordsLookup(geojson) {
  var lookup = {};
  geojson.features.forEach(feature => {
    lookup[feature.id] = feature;
  });
  return lookup;
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

  _onHover({x, y, hoveredObject, target}) {
    this.setState({x, y, hoveredObject, tooltipTarget: target});
  }

  _renderTooltip() {
    const {x, y, hoveredObject, tooltipTarget} = this.state;

    if (!hoveredObject) {
      return null;
    }
    
    const net = tooltipTarget ? tooltipTarget.net : 0;

    return (
      <div style={{...tooltipStyle, left: x, top: y}}>
        <div>{hoveredObject.id}</div>
        <div>{`Net gain: ${net}`}</div>
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
    const {viewport, data, mouseEntered, hoveredObject: object} = this.state;
    const {filterConfig, coords, calcMethod, dataBounds} = this.props;
    
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
            calcMethod={calcMethod}
            dataBounds={dataBounds}
            opacity={0.3}
            strokeWidth={2}
            enableBrushing={true}
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
      
      const coordsLookup = createCoordsLookup(coords);
      const initLayerData = getLayerData(filter.result, coordsLookup);
      const gainValues = Object.keys(initLayerData.targetDict).map(k => initLayerData.targetDict[k].net);
    
      filters.forEach(f => {
        if (f.startValue) {
          filter.filter(f.filter, f.startValue);
        }
      });
    
      render(<Root filter={filter}
              filterConfig={filters}
              coords={coords}
              dataBounds={gainValues}
              calcMethod={getLayerDataCalculator(coordsLookup)} />,
        document.getElementById("map"));
    } else {
      console.error(error);
    }
  });
