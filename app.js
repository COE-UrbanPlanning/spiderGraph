/* global window,document */
import React, {Component} from 'react';
import {render} from 'react-dom';
import MapGL from 'react-map-gl';
import {queue} from 'd3-queue';
import {json as requestJSON} from 'd3-request';
import {csvParse} from 'd3-dsv';
import JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';
import Set from 'es6-set';

import DeckGLOverlay from './components/deckgl-overlay.js';
import DataFilter from './components/filter.js';
import Controls from './components/controls.js';

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

const filterCriteria = {
  gain: {
    arcs: ['target'],
    targets: ['source']
  },
  net: {
    arcs: ['source', 'target'],
    targets: ['source', 'target']
  },
  loss: {
    arcs: ['source'],
    targets: ['target']
  }
};

// Source data locations
const DATA_URL = './data/trips_nbhd_district.zip';
const COORDS_URL = './data/coords_nbhd_district.min.zip';
const FILTERS_URL = 'filters.json';

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
    
    this.state = {
      viewport: {
        ...DeckGLOverlay.defaultViewport,
        width: window.innerWidth,
        height: window.innerHeight
      },
      data: null,
      mousePosition: [0, 0],
      toggleSelected: 'net'
    };
    
    this._showLoading = this._showLoading.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this._resize.bind(this));
    this.draw();
    this._resize();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.filter !== this.props.filter) {
      this.filter = nextProps.filter;
      this.draw();
    }
  }
  
  _resize() {
    this._onViewportChange({
      width: window.innerWidth,
      height: window.innerHeight
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
    // target will be undefined if no trips went to the hovered zone
    this.setState({x, y, hoveredObject, tooltipTarget: target});
  }

  _onClick({hoveredObject}) {
    const {selectedObject: selected} = this.state;
    
    this._showLoading();
    
    setTimeout(() => {
      if (!selected || hoveredObject.id !== selected.id) {
        this.filterPlace(this.state.toggleSelected, hoveredObject);
      } else {
        this.filterPlace(this.state.toggleSelected, null);
      }
    }, 50);
  }

  _showLoading() {
    document.getElementById('map')
        .classList.add('disable');
    document.body.classList.add('progress');
  }
  
  _stopLoading() {
    document.getElementById('map')
        .classList.remove('disable');
    document.body.classList.remove('progress');
  }

  toggleDisplay(selection) {
    this._showLoading();
    
    setTimeout(() => {
      this.filterPlace(selection, this.state.selectedObject);
    }, 50);
  }

  filterPlace(toggleSelected, selectedObject) {
    var filterArgs = {};
    if (selectedObject) {
      filterCriteria[toggleSelected]['arcs'].forEach(c => {
        filterArgs[c] = selectedObject.id;
      });
      try {
        this.filter.filterPlace(filterArgs);
      } catch (e) {
        this.draw({toggleSelected});
        return;
      }
    }
    else {
      this.filter.filterPlace(null);
    }
    this.draw({toggleSelected, selectedObject});
  }

  filterMap(dim, filterText) {
    this._showLoading();
    
    setTimeout(() => {
      this.filter.filter(dim, filterText);
      this.draw();
    }, 50);
  }

  resetFilters() {
    this.filter.reset();
    this.draw();
  }

  draw(args) {
    if (this.filter) {
      this.setState(Object.assign({}, args, {
        data: this.filter.result
      }));
      this._stopLoading();
    }
  }

  render() {
    const {viewport, data, mouseEntered, mousePosition, hoveredObject, selectedObject, toggleSelected} = this.state;
    const {filterConfig, coords} = this.props;

    return (
      <div onMouseMove={this._onMouseMove.bind(this)}
           onMouseOver={this._onMouseOver.bind(this)}
           onMouseOut={this._onMouseOut.bind(this)}>
        <MapGL
          {...viewport}
          onViewportChange={this._onViewportChange.bind(this)}
          mapboxApiAccessToken={MAPBOX_TOKEN}>
          <DeckGLOverlay viewport={viewport}
            data={data ? data : []}
            coords={coords}
            hoveredFeature={hoveredObject}
            selectedFeature={selectedObject}
            opacity={0.3}
            strokeWidth={2}
            enableBrushing={true}
            mouseEntered={mouseEntered}
            mousePosition={mousePosition}
            toggleSelected={toggleSelected}
            onHover={this._onHover.bind(this)}
            onClick={this._onClick.bind(this)}
          />
        </MapGL>
        <Controls
          filters={filterConfig}
          filterHandler={this.filterMap.bind(this)}
          toggleSelected={toggleSelected}
          toggleHandler={this.toggleDisplay.bind(this)} />
      </div>
    );
  }
}

function loadZip(zipFile, parser, callback) {
  JSZipUtils.getBinaryContent(zipFile, function(error, zip) {
    if(error) {
      callback(error, zip);
      return;
    }
    
    var jszip = new JSZip();
    jszip.loadAsync(zip).then(() => {
      const filename = Object.keys(jszip.files)[0];
      jszip.file(filename).async('string').then(data => { callback(null, parser(data)); })
    });
  });
}

render(<Root filter={null}
              filterConfig={null}
              coords={null} />,
        document.getElementById("map"));

var filter = new DataFilter();
window.filter = filter;

queue()
  .defer(loadZip, DATA_URL, csvParse)
  .defer(loadZip, COORDS_URL, JSON.parse)
  .defer(requestJSON, FILTERS_URL)
  .await((error, data, coords, filters) => {
    if (!error) {
      filter.loadData(data);

      filters.forEach(f => {
        if (f.startValue) {
          filter.filter(f.filter, f.startValue);
        }
        if (f.startRange) {
          filter.filter(f.filter, f.startRange.concat([f.overflowTop]));
        }
        if (f.startChecked) {
          filter.filter(f.filter, new Set(f.startChecked));
          console.log('checked');
        }
      });

      window.a = render(<Root filter={filter}
              filterConfig={filters}
              coords={coords} />,
        document.getElementById("map"));
    } else {
      console.error(error);
    }
  });
