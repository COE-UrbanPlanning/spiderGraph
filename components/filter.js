import crossfilter from 'crossfilter2';
import {csv as requestCSV} from 'd3-request';

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
  
  get result() {
    return this._data.allFiltered();
  }
  
  loadData(data_file, callback) {
    requestCSV(data_file, (error, data) => {
      if (!error) {
        this._raw_data = data;
        this._data = crossfilter(data);
        this.buildFilters();
      }
      if (callback) { callback(error, this); }
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
  
  reset() {
    Object.keys(this.filters).forEach(filter => {
      this.filters[filter].filterAll();
    });
  }
  
  _getFilterCriteria(filterValues) {
    if (!(filterValues.constructor === Array)) {
      filterValues = [filterValues];
    }
    return d => filterValues.map(v => String(v)).includes(d);
  }
  
  filter(dim, filterValues) {
    this.filters[dim].filterAll();
    this.filters[dim].filter(this._getFilterCriteria(filterValues));
    return this;
  }
}
