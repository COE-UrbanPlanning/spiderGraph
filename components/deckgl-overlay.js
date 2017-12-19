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
  pointerEvents: 'none',
  zIndex: 999,
  borderRadius: '3px',
  padding: '10px',
  backgroundColor: 'rgba(68,68,68,0.8)',
  color: 'white',
  fontSize: '16px',
  fontWeight: '300'
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

    this.coordsLookup = props.coords ? this._createCoordsLookup(coords) : {};

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
      ...this._getLayerData(this.props.data)
    });
  }
  /* eslint-enable react/no-did-mount-set-state */

  componentWillReceiveProps(nextProps) {
    if (nextProps.coords && nextProps.coords !== this.coords) {
      this.coordsLookup = this._createCoordsLookup(nextProps.coords);
    }

    if (nextProps.data !== this.props.data) {
      this.setState({
        ...this._getLayerData(nextProps.data)
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

  _renderTooltip() {
    const {targetDict} = this.state;
    const {mousePosition, hoveredFeature, selectedFeature, mouseEntered, toggleSelected} = this.props;

    if (!mouseEntered || !hoveredFeature) {
      return null;
    }

    const target = targetDict[hoveredFeature.id];

    let value = 0;
    if (target) {
      if (selectedFeature) {
        // Hovering over selected feature gives number corresponding to toggleSelected.
        // This is also the case when toggleSelected is 'net' since opposite of net is net
        if (toggleSelected === 'net' || selectedFeature.id === hoveredFeature.id) {
          value = target[toggleSelected];
        // hovering over anything else gives opposite of toggleSelected
        } else if (toggleSelected === 'loss') {
          value = target.gain;
        } else {
          value = target.loss;
        }
      // if no zone is selected we always pick 'net'
      } else {
        value = target.net;
      }
    }

    const scale = value >= 0 ? this.state.posScale : this.state.negScale;

    return (
      <div style={{...tooltipStyle, left: mousePosition[0], top: mousePosition[1]}}>
        <div>{hoveredFeature.id}</div>
        <div><span style={{color: scale(value), fontWeight: '400', fontSize: '24px'}}>{`${Math.abs(value)}`}</span> trips</div>
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

  _getFillColour(targets, f) {
    var target = targets[f.id];
    if (!target) {
      return [0, 0, 0, 0];
    }
    const scale = target.net >= 0 ? this.state.posScale : this.state.negScale;
    var colourString = scale(target.net);
    var colourArray = colourString.substring(colourString.indexOf('(') + 1, colourString.lastIndexOf(')')).split(/,\s*/);
    if (colourArray.length === 3) {
      colourArray.push('255');
    }
    return colourArray;
  }

  _getLayerData(data) {

    if (!data) {
      return null;
    }

    const pairs = {};
    const targetDict = {};
    const arcs = [];
    const not_found = [];

    data.forEach(trip => {
      const source = trip['I'];
      const target = trip['J'];
      const count = Number(trip['count']);

      var error = false;
      if (!this.coordsLookup.hasOwnProperty(source)) {
        error = true;
        if (!not_found.includes(source)) {
          not_found.push(source);
        }
      }
      if (!this.coordsLookup.hasOwnProperty(target)) {
        error = true;
        if (!not_found.includes(target)) {
          not_found.push(target);
        }
      }
      if (error) {
        return;
      }

      if (source == target) {
        return;
      }

      if (!pairs[[source, target]]) {
        pairs[[source, target]] = {
          name: source,
          position: this.coordsLookup[source].properties.centroid,
          target: target,
          count: count
        };
      } else {
        pairs[[source, target]].count += count;
      }

      if (!targetDict[source]) {
        targetDict[source] = {
          name: source,
          position: this.coordsLookup[source].properties.centroid,
          gain: 0,
          loss: -count,
          net: -count
        };
      } else {
        targetDict[source].loss -= count;
        targetDict[source].net -= count;
      }

      if (!targetDict[target]) {
        targetDict[target] = {
          name: target,
          position: this.coordsLookup[target].properties.centroid,
          gain: count,
          loss: 0,
          net: count
        };
      } else {
        targetDict[target].gain += count;
        targetDict[target].net += count;
      }
    });

    Object.keys(pairs).forEach(pairKey => {
      const {name, position, target, count} = pairs[pairKey];
      const reverse = pairs[pairKey.split(',').reverse()];

      if (count > 0) { // only push positive arcs
        if (typeof reverse !== 'undefined') {
          // still only push positive arcs
          const net = count - reverse.count;
          if (net >= 0) {
            arcs.push({
              sourceID: name,
              targetID: target,
              source: position,
              target: this.coordsLookup[target].properties.centroid,
              value: net
            });
          }
        } else {
          // if there were no trips in reverse direction, just
          // push arc with net === count
          arcs.push({
            sourceID: name,
            targetID: target,
            source: position,
            target: this.coordsLookup[target].properties.centroid,
            value: count
          });
        }
      }

    });

    if (not_found.length > 0) {
      console.warn('The following zones were omitted because their centroid coordinates were not found: ' + not_found.join(', '));
    }

    return {arcs, targetDict};
  }

  render() {
    const {viewport, enableBrushing, strokeWidth, hoveredFeature, selectedFeature, opacity, mouseEntered, coords} = this.props;
    const {arcs, targetDict: targets, onHover} = this.state;

    if (!coords) {
      return null;
    }

    const possibleValues = Object.keys(targets).map(k => targets[k].net);
    possibleValues.push(0);

    if (!arcs || possibleValues.length < buckets) {
      return null;
    }

    // get ckmeans, then use maximums of each group (+1) as domains
    const groupings = ckmeans(possibleValues.map(Math.abs), buckets - 1);
    const thresholdDomain = groupings.map(g => g.slice(-1)[0] + 1);
    this.state.posScale.domain(thresholdDomain);
    this.state.negScale.domain(thresholdDomain.map(d => -d).reverse());

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
