import React, {Component} from 'react';
import {scaleLinear} from 'd3-scale';

import DeckGL, {GeoJsonLayer} from 'deck.gl';
import ArcBrushingLayer from '../arc-brushing-layer';
import ScatterplotBrushingLayer from '../scatterplot-brushing-layer';

export const inFlowColors = [
  [35, 181, 184]
];

export const outFlowColors = [
  [166, 3, 3]
];

// migrate out
const sourceColor = [166, 3, 3];
// migrate in
const targetColor = [35, 181, 184];

export default class DeckGLOverlay extends Component {

  static get defaultViewport() {
    return {
      longitude: -113.5,
      latitude: 53.525,
      zoom: 10.5,
      maxZoom: 20,
      pitch: 0,
      bearing: 0
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      arcs: [],
      coordsLookup: this._createCoordsLookup(props.coords)
    };
  }

  /* eslint-disable react/no-did-mount-set-state */
  componentDidMount() {
    this.setState({
      ...this._getLayerData(this.props)
    });
  }
  /* eslint-enable react/no-did-mount-set-state */

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({
        ...this._getLayerData(nextProps)
      });
    }
  }

  _createCoordsLookup(geojson) {
    var lookup = {};
    geojson.features.forEach(feature => {
      lookup[feature.id] = feature;
    });
    return lookup;
  }
  
  _getLayerData(props) {
    const data = props.data;
    const coords = this.state.coordsLookup;
    
    if (!data) {
      return null;
    }
    
    const pairs = {};
    const arcs = [];
    const not_found = [];
    
    function processData(trip) {
      const source = trip['I'];
      const target = trip['J'];
      const count = Number(trip['count']);
      
      var error = false;
      if (!coords.hasOwnProperty(source)) {
        error = true;
        if (!not_found.includes(source)) {
          not_found.push(source);
        }
      }
      if (!coords.hasOwnProperty(target)) {
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
          position: coords[source].properties.centroid,
          target: target,
          gain: gain,
          loss: loss
        };
      } else {
        pairs[[source, target]].gain += gain;
        pairs[[source, target]].loss += loss;
      }
    }
    
    data.forEach(processData);
    
    Object.keys(pairs).forEach(pairKey => {
      const {name, position, target, gain, loss} = pairs[pairKey];
      const gainSign = Math.sign(gain);
      const net = gain + loss;
      
      arcs.push({
        sourceID: name,
        targetID: target,
        source: position,
        target: coords[target].properties.centroid,
        value: net
      });
    });
    
    if (not_found.length > 0) {
      console.warn('The following TAZs were omitted because their centroid coordinates were not found: ' + not_found.join(', '));
    }
    
    return {arcs};
  }

  render() {
    const {viewport, enableBrushing, strokeWidth, feature, opacity, mouseEntered, coords} = this.props;
    const {arcs} = this.state;

    // mouseEntered is undefined when mouse is in the component while it first loads
    // enableBrushing if mouseEntered is not defined
    const isMouseover = mouseEntered !== false;
    const startBrushing = Boolean(isMouseover && enableBrushing);

    if (!arcs) {
      return null;
    }

    const layers = [
      new ArcBrushingLayer({
        id: 'arc',
        data: arcs,
        strokeWidth: strokeWidth,
        opacity,
        featureID: feature ? feature.id : null,
        enableBrushing: startBrushing,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: d => sourceColor,
        getTargetColor: d => targetColor
      }),
      new GeoJsonLayer({
        id: 'geojson-layer',
        data: coords,
        filled: true,
        stroked: true,
        extruded: false,
        pickable: true,
        onHover: this.props.onHover,
        getFillColor: f => [0, 0, 0, 128],
        getLineWidth: f => 15
      })
    ];
    
    return (
      <DeckGL {...viewport} layers={ layers } initWebGLParameters />
    );
  }
}
