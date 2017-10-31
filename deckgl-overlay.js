import React, {Component} from 'react';
import {scaleLinear} from 'd3-scale';

import DeckGL from 'deck.gl';
import ArcBrushingLayer from './arc-brushing-layer';
import ScatterplotBrushingLayer from './scatterplot-brushing-layer';

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
      targets: [],
      sources: []
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

  _getLayerData(props) {
    const data = props.data;
    const coords = props.coords;
    
    if (!data) {
      return null;
    }
    
    const pairs = {};
    const targetDict = {};
    const arcs = [];
    const targets = [];
    const sources = [];
    const not_found = [];
    
    function processData(trip) {
      const source = trip['I'];
      const target = trip['J'];
      const count = trip['count'];
      
      var error = false;
      if (!coords.hasOwnProperty(source)) {
        not_found.push(source);
        error = true;
      }
      if (!coords.hasOwnProperty(target)) {
        not_found.push(target);
        error = true;
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
          position: coords[source].centroid,
          target: target,
          gain: gain,
          loss: loss
        };
      } else {
        pairs[[source, target]].gain += gain;
        pairs[[source, target]].loss += loss;
      }
      
      // needs gain, loss, net, radius
      if (!targetDict[target]) {
        targetDict[target] = {
          name: target,
          position: coords[target].centroid,
          gain: 0,
          loss: 0,
          net: 0
        };
      }
    }
    
    // data.forEach(processData);
    for (var i = 0; i < data.length; i++) {
      processData(data[i]);
    }
    
    Object.keys(pairs).forEach(pairKey => {
      const {name, position, target, gain, loss} = pairs[pairKey];
      const gainSign = Math.sign(gain);
      const net = gain + loss;
      
      targetDict[target].gain += gain;
      targetDict[target].loss += loss;
      targetDict[target].net += net;
      
      sources.push({
        name: name,
        gain: -gainSign,
        position: position,
        target: coords[target].centroid,
        radius: 0
      });
      
      arcs.push({
        points: [name, target],
        source: position,
        target: coords[target].centroid,
        value: net
      });
    });
    
    Object.keys(targetDict).forEach(target => {
      targets.push(targetDict[target]);
    });
    
    // sort targets by radius large -> small
    targets.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
    if (targets.length > 0) {
      const sizeScale = scaleLinear()
      .domain([0, Math.abs(targets[0].net)])
      .range([0.0036, 0.04]);

      targets.forEach(pt => {
        pt.radius = Math.sqrt(sizeScale(Math.abs(pt.net)));
      });
    }
    
    if (not_found) {
      console.warn('The following TAZs were omitted because their centroid coordinates were not found: ' + not_found.join(', '));
    }
    
    console.log({arcs, targets, sources});
    return {arcs, targets, sources};
  }

  render() {
    const {viewport, enableBrushing, brushRadius, strokeWidth,
      opacity, mouseEntered, mousePosition} = this.props;
    const {arcs, targets, sources} = this.state;

    // mouseEntered is undefined when mouse is in the component while it first loads
    // enableBrushing if mouseEntered is not defined
    const isMouseover = mouseEntered !== false;
    const startBrushing = Boolean(isMouseover && enableBrushing);

    if (!arcs || !targets) {
      return null;
    }

    const layers = [
      new ScatterplotBrushingLayer({
        id: 'sources',
        data: sources,
        brushRadius,
        brushTarget: true,
        mousePosition,
        opacity: 1,
        enableBrushing: startBrushing,
        pickable: false,
        // only show source points when brushing
        radiusScale: startBrushing ? 3000 : 0,
        getColor: d => (d.gain > 0 ? targetColor : sourceColor),
        getTargetPosition: d => [d[0], d[1], 0]
      }),
      new ScatterplotBrushingLayer({
        id: 'targets-ring',
        data: targets,
        brushRadius,
        mousePosition,
        strokeWidth: 2,
        outline: true,
        opacity: 1,
        enableBrushing: startBrushing,
        // only show rings when brushing
        radiusScale: startBrushing ? 4000 : 0,
        getColor: d => (d.net > 0 ? targetColor : sourceColor)
      }),
      new ScatterplotBrushingLayer({
        id: 'targets',
        data: targets,
        brushRadius,
        mousePosition,
        opacity: 1,
        enableBrushing: startBrushing,
        pickable: true,
        radiusScale: 3000,
        onHover: this.props.onHover,
        getColor: d => (d.net > 0 ? targetColor : sourceColor)
      }),
      new ArcBrushingLayer({
        id: 'arc',
        data: arcs,
        strokeWidth,
        opacity,
        brushRadius,
        enableBrushing: startBrushing,
        mousePosition,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: d => sourceColor,
        getTargetColor: d => targetColor
      })
    ];

    return (
      <DeckGL {...viewport} layers={ layers } initWebGLParameters />
    );
  }
}
