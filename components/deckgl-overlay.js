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
      targetDict: {},
      scale: scaleLinear()
        .domain([0, props.maximum])
        .range(['white', 'rgb(30,144,255)'])
    };
  }

  /* eslint-disable react/no-did-mount-set-state */
  componentDidMount() {
    this.setState({
      ...this.props.calcMethod(this.props.data)
    });
  }
  /* eslint-enable react/no-did-mount-set-state */

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({
        ...this.props.calcMethod(nextProps.data)
      });
    }
  }

  _renderTooltip() {
    const {x, y, hoveredObject, targetDict} = this.state;

    if (!hoveredObject) {
      return null;
    }

    const target = targetDict[hoveredObject.id];
    const net = target ? target.net : 0;
    
    return (
      <div style={{...tooltipStyle, left: x, top: y}}>
        <div>{hoveredObject.id}</div>
        <div>{`Net gain: ${net}`}</div>
      </div>
    );
  }

  _onHover({x, y, object}) {
    const {targetDict} = this.state;
    
    if (this.props.onHover) {
      if (!object) {
        this.props.onHover({x, y});
        return;
      }

      const target = targetDict[object.id];
    
      this.props.onHover({x, y, hoveredObject: object, target});
    }
  }

  _getFillColour(targets, f) {
    var target = targets[f.id];
    if (!target) {
      return [0, 0, 0, 0];
    }
    var colourString = this.state.scale(target.gain);
    var colourArray = colourString.substring(colourString.indexOf('(') + 1, colourString.lastIndexOf(')')).split(/,\s*/);
    if (colourArray.length === 3) {
      colourArray.push(255);
    }
    return colourArray;
  }
  
  render() {
    const {viewport, enableBrushing, strokeWidth, feature, opacity, mouseEntered, coords} = this.props;
    const {arcs, targetDict: targets, onHover} = this.state;

    // mouseEntered is undefined when mouse is in the component while it first loads
    // enableBrushing if mouseEntered is not defined
    const isMouseover = mouseEntered !== false;
    const startBrushing = Boolean(isMouseover && enableBrushing);

    if (!arcs) {
      return null;
    }
    
    const layers = [
      new GeoJsonLayer({
        id: 'geojson-layer',
        data: coords,
        filled: true,
        stroked: true,
        extruded: false,
        pickable: true,
        onHover: this._onHover.bind(this),
        getFillColor: f => this._getFillColour(targets, f),
        getLineWidth: f => 15,
        updateTriggers: {
          getFillColor: [targets]
        }
      }),
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
      })
    ];
    
    return (
      <div>
        {this._renderTooltip()}
        <DeckGL {...viewport} layers={layers} initWebGLParameters />
      </div>
    );
  }
}
