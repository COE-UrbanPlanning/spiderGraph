import React, {Component} from 'react';
import {Range} from 'rc-slider';

export default class RangePanel extends Component {
  constructor(props) {
    super(props);
    
    this.handler = props.handler;
    this._notifyValues = this._notifyValues.bind(this);
    
    this.state = {
      filter: props.data.filter,
      currentPosition: null
    };
  }
  
  _buildNumericalMap(valueMap) {
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
  
  _getValueSet(values) {
    var numbers = [];
    for (var i = values[0]; i < values[1]+1; i++) {
      numbers.push(i);
    }
    return numbers;
  }
  
  _notifyValues(values) {
    this.handler(this.state.filter, this._getValueSet(values));
    this.setState({currentPosition: values});
  }
  
  render() {
    const {label, type, valueMap} = this.props.data;
    const formatMap = this._buildNumericalMap(valueMap);
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
