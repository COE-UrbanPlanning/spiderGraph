import React, {Component} from 'react';
import Slider from 'rc-slider';

export default class ContinuousPanel extends Component {
  constructor(props) {
    super(props);
    
    this.handler = props.handler;
    this._notifyValue = this._notifyValue.bind(this);
    
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
  
  _notifyValue(value) {
    this.handler(this.state.filter, value);
    this.setState({currentPosition: value});
  }
  
  render() {
    const {filter, label, type, valueMap} = this.props.data;
    const formatMap = this._buildNumericalMap(valueMap);
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
          onChange={this._notifyValue} />
      </div>
    );
  }
}
