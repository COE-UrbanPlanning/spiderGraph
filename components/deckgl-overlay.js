import React, {Component} from 'react';
import {scaleQuantile, scaleThreshold} from 'd3-scale';
import {ckmeans} from 'simple-statistics';

import DeckGL, {GeoJsonLayer} from 'deck.gl';
import ArcBrushingLayer from '../arc-brushing-layer';
import ScatterplotBrushingLayer from '../scatterplot-brushing-layer';

export const inFlowColors = [
  [35, 181, 184]
];

export const outFlowColors = [
  [166, 3, 3]
];

const mapWhite = 'rgb(247,247,247)';
const buckets = 6;

const colorbrewer_WhBu = [
  mapWhite,
  'rgb(209,229,240)',
  'rgb(146,197,222)',
  'rgb(67,147,195)',
  'rgb(33,102,172)',
  'rgb(5,48,97)'
];

const colorbrewer_WhRd = [
  'rgb(103,0,31)',
  'rgb(178,24,43)',
  'rgb(214,96,77)',
  'rgb(244,165,130)',
  'rgb(253,219,199)',
  mapWhite
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

const filterCriteria = {
  gain: {arcs: ['targetID'], targets: ['sourceID']},
  net: {arcs: ['sourceID', 'targetID'], targets: ['sourceID', 'targetID']},
  loss: {arcs: ['sourceID'], targets: ['targetID']}
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
      // posScale: scaleQuantile().range(colorbrewer_WhBu),
      // negScale: scaleQuantile().range(colorbrewer_WhRd)
      posScale: scaleThreshold().range(colorbrewer_WhBu),
      negScale: scaleThreshold().range(colorbrewer_WhRd)
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

  _onClick({object}) {
    this.props.onClick({hoveredObject: object});
  }
  
  _getFillColour(targets, f, toggleSelected) {
    var target = targets[f.id];
    if (!target) {
      return [0, 0, 0, 0];
    }
    const scale = target[toggleSelected] >= 0 ? this.state.posScale : this.state.negScale;
    var colourString = scale(target[toggleSelected]);
    var colourArray = colourString.substring(colourString.indexOf('(') + 1, colourString.lastIndexOf(')')).split(/,\s*/);
    if (colourArray.length === 3) {
      colourArray.push('255');
    }
    return colourArray;
  }
  
  _filterArcsBySelected(arcs, selectedFeature, toggleSelected) {
    if (!selectedFeature) {
      return arcs;
    }
    // get arcs that match selected feature ID, based on source or target or both
    const criteria = a => filterCriteria[toggleSelected]['arcs'].map(c => a[c]);
    return arcs.filter(a => criteria(a).includes(selectedFeature.id));
  }
  
  _filterTargetsByArcs(targets, arcs, selectedFeature, toggleSelected) {
    if (!selectedFeature) {
      return targets;
    }
    if (selectedFeature) {
      var filtered = {};
      // get targets at the ends of arcs
      const criteria = a => filterCriteria[toggleSelected]['targets'].map(c => a[c]);
      arcs.forEach(a => {
        if (criteria(a).includes(selectedFeature.id)) {
          let zone = [a.sourceID, a.targetID].filter(z => z !== selectedFeature.id)[0];
          // ignore trips from A -> A
          if (typeof zone !== 'undefined') {
            filtered[zone] = targets[zone];
          }
        }
      });
      return filtered;
    }
  }
  
  render() {
    const {viewport, enableBrushing, strokeWidth, hoveredFeature, selectedFeature, toggleSelected, opacity, mouseEntered, coords} = this.props;
    const {arcs, targetDict: targets, onHover} = this.state;

    if (!arcs) {
      return null;
    }
    
    const filteredArcs = this._filterArcsBySelected(arcs, selectedFeature, toggleSelected);
    const filteredTargets = this._filterTargetsByArcs(targets, filteredArcs, selectedFeature, toggleSelected);
    
    if (Object.keys(filteredTargets).length < buckets) {
      return null;
    }
    
    // do something if not enough buckets
    const possibleValues = Object.keys(filteredTargets).map(k => filteredTargets[k][toggleSelected]);
    possibleValues.push(0);
    
    // get ckmeans, then use maximums of each group (+1) as domains
    const groupings = ckmeans(possibleValues.map(Math.abs), buckets - 1);
    const thresholdDomain = groupings.map(g => g.slice(-1)[0] + 1);
    this.state.posScale.domain(thresholdDomain);
    this.state.negScale.domain(thresholdDomain.map(d => -d));

    // const highestFiltered = Math.max(Math.max(...possibleValues), Math.abs(Math.min(...possibleValues)));
    // this.state.posScale.domain(possibleValues.filter(v => v >= 0));
    // this.state.negScale.domain(possibleValues.filter(v => v < 0));

    // mouseEntered is undefined when mouse is in the component while it first loads
    // enableBrushing if mouseEntered is not defined
    const isMouseover = mouseEntered !== false;
    const startBrushing = Boolean(isMouseover && enableBrushing && !selectedFeature);
    
    const layers = [
      new GeoJsonLayer({
        id: 'geojson-layer',
        data: coords,
        filled: true,
        stroked: true,
        extruded: false,
        pickable: true,
        onHover: this._onHover.bind(this),
        onClick: this._onClick.bind(this),
        getFillColor: f => this._getFillColour(filteredTargets, f, toggleSelected),
        getLineWidth: f => 15,
        updateTriggers: {
          getFillColor: [filteredTargets, selectedFeature, toggleSelected]
        }
      }),
      new ArcBrushingLayer({
        id: 'arc',
        data: filteredArcs,
        strokeWidth: strokeWidth,
        opacity,
        hoveredFeatureID: hoveredFeature ? hoveredFeature.id : null,
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
