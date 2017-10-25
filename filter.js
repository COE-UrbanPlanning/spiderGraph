import crossfilter from 'crossfilter2';
import {json as requestJSON, csv as requestCSV} from 'd3-request';
import {queue} from 'd3-queue';

export default class DataFilter {
  constructor() {
    this.filters = {};
  }
  
  get data() {
    return this._data;
  }
  
  get raw_data() {
    return this._raw_data;
  }
    
  get coords() {
    return this._coords;
  }
  
  get result() {
    return this._data.allFiltered();
  }
  
  loadData(data_file, coords_file, callback) {
    queue()
      .defer(requestCSV, data_file)
      .defer(requestJSON, coords_file)
      .await((error, data, coords) => {
        if (!error) {
          this._raw_data = data;
          this._data = crossfilter(data);
          this._coords = coords;
          this.buildFilters();
          if (callback) { callback(this); }
        }
      });
  }
  
  buildFilters() {
    var nonfilters = ['i', 'j', 'count'];
    Object.keys(this.raw_data[0])
      .filter(col => !nonfilters.includes(col.toLowerCase()))
      .forEach(col => {
        this.filters[col] = this.data.dimension(d => d[col]);
      });
    return this;
  }
  
  filter(dim, filterText) {
    this.filters[dim].filterAll();
    this.filters[dim].filter(d => d.startsWith(filterText));
    return this;
  }
}
