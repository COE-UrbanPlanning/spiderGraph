import React, {Component} from 'react';
import {Range} from 'rc-slider';

export default class RangePanel extends Component {
  constructor(props) {
    super(props);
    
    this.handler = props.handler;
    this._notifyValues = this._notifyValues.bind(this);
    
    this.state = {
      filter: props.data.filter,
      currentPosition: null,
      overflow: props.data.overflowTop === true ? true : false
    };
  }
  
  _valueMap(values) {
    var valueMap = {};
    values.forEach(v => {
      valueMap[v[0]] = v[1];
    });
    return valueMap;
  }
  
  _numericalMap(valueMap) {
    var newMap = {};
    try {
      Object.keys(valueMap).forEach(key => {
        newMap[Number(key)] = valueMap[key];
      });
      return newMap;
    } catch (e) {
      console.error('valueMap for continuous/range filter is not numerical');
    }
  }
  
  _notifyValues(values) {
    this.handler(this.state.filter, values);
    this.setState({currentPosition: values});
  }
  
  render() {
    const {label, type, values} = this.props.data;
    const valueMap = this._valueMap(values);
    const formatMap = this._numericalMap(valueMap);
    const min = Math.min.apply(Math, Object.keys(formatMap));
    const max = Math.max.apply(Math, Object.keys(formatMap));
    
    return (
      <div className="slider">
        <Range
          min={min}
          max={max}
          marks={valueMap}
          defaultValue={this.state.currentPosition ? this.state.currentPosition : [min, max]}
          step={null}
          onChange={this._notifyValues} />
      </div>
    );
  }
}
