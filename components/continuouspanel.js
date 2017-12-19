import React, {Component} from 'react';
import Slider from 'rc-slider';

export default class ContinuousPanel extends Component {
  constructor(props) {
    super(props);
    const {filter, startValue} = props.data;
    
    this.handler = props.handler;
    this._onChange = this._onChange.bind(this);
    this._notifyValues = this._notifyValues.bind(this);
    
    this.state = {
      filter: filter,
      currentPosition: startValue || null
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
  
  _onChange(value) {
    this.setState({currentPosition: value});
  }
  
  _notifyValues(value) {
    this.handler(this.state.filter, value);
  }
  
  render() {
    const {filter, label, type, values} = this.props.data;
    const valueMap = this._valueMap(values);
    const formatMap = this._numericalMap(valueMap);
    const min = Math.min.apply(Math, Object.keys(formatMap));
    const max = Math.max.apply(Math, Object.keys(formatMap));
    
    return (
      <div className="slider">
        <Slider 
          min={min}
          max={max}
          marks={valueMap}
          defaultValue={this.state.currentPosition}
          step={null}
          included={false}
          onChange={this._onChange}
          onAfterChange={this._notifyValues} />
      </div>
    );
  }
}
