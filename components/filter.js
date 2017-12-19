import crossfilter from 'crossfilter2';
import Set from 'es6-set';

export default class DataFilter {
  constructor() {
    this.filters = {};
    this._currentFilterCriteria = {};
    this.loadData = this.loadData.bind(this);
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

  loadData(csvData) {
    this._raw_data = csvData;
    this._data = crossfilter(csvData);
    this.buildFilters();
  }

  buildFilters() {
    var nonfilters = ['i', 'j', 'count'];
    Object.keys(this.raw_data[0])
      .filter(col => !nonfilters.includes(col.toLowerCase()))
      .forEach(col => {
        this._currentFilterCriteria[col] = null;
        this.filters[col] = this.data.dimension(d => d[col]);
      });

    this.placeFilter = this.data.dimension(d => d['I'] + '|' + d['J']);
    this._currentFilterCriteria['place'] = null;
    return this;
  }

  reset() {
    Object.keys(this.filters).forEach(filter => {
      this.filters[filter].filterAll();
    });
    return this;
  }

  _getValueSet(start, end) {
    var numbers = [];
    for (var i = start; i < end+1; i++) {
      numbers.push(i);
    }
    return new Set(numbers.map(v => String(v)));
  }
  
  _filterValues(valueSet) {
    return d => valueSet.has(d);
  }
  
  _filterRange([start, end, overflow]) {
    const inRange = this._filterValues(this._getValueSet(start, end));
    
    if (overflow === true) {
      return d => inRange(d) || d > end;
    }
    return inRange;
  }
  
  _getFilterCriteria(params) {
    // covers multiple values
    if (params.constructor === Set) {
      return this._filterValues(params);
    }
    // covers ranges
    if (params.constructor === Array && (params.length === 2 || params.length === 3)) {
      return this._filterRange(params);
    }
    // covers exact value, null, functions
    return params;
  }

  _testFilter(dimension, dim, criteria) {
    const oldCriteria = this._currentFilterCriteria[dim];
    dimension.filter(criteria);
    if (this.result.length > 0) {
      this._currentFilterCriteria[dim] = criteria;
    } else {
      dimension.filter(oldCriteria);
      throw 'result of filter was empty';
    }
  }
  
  filter(dim, params) {
    this.filters[dim].filter(this._getFilterCriteria(params));
    return this;
  }

  filterPlace(dct, filterAnd) {
    if (dct) {
      var matchSource = src => src === dct.source;
      var matchTarget = tgt => tgt === dct.target;
      // delimited string to array
      var spl = d => d.split('|');

      let criteria = null;
      if (filterAnd) {
        criteria = d => matchSource(spl(d)[0]) && matchTarget(spl(d)[1]);
      } else {
        criteria = d => matchSource(spl(d)[0]) || matchTarget(spl(d)[1]);
      }
      this._testFilter(this.placeFilter, 'place', criteria);
    }
    else {
      this._testFilter(this.placeFilter, 'place', null);
    }
    return this;
  }
}
