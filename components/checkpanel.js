import React, {Component} from 'react';
import Set from 'es6-set';

export default class CheckPanel extends Component {
  constructor(props) {
    super(props);
    const {filter, startChecked, values} = props.data;
    
    this.handler = props.handler;
    this.handleClick = this.handleClick.bind(this);
    this._buildButton = this._buildButton.bind(this);
    this._notifyValues = this._notifyValues.bind(this);
    
    this.state = {
      filter: filter,
      currentSelected: this._createCurrentSelected(values, startChecked)
    };
  }
  
  _createCurrentSelected(values, checked) {
    var selected = {};
    values.forEach(v => {
      if (checked) {
        selected[v[0]] = checked.includes(v[0]);
      } else {
        selected[v[0]] = true;
      }
    });
    return selected;
  }
  
  _buildButton(value, i) {
    var className = "filter-button";
    if (this.state.currentSelected[value[0]] === true) {
      className += ' selected';
    }
    return (
      <div key={i}
        className={className}
        onClick={e => this.handleClick(e, value[0])}>
        {value[1]}
      </div>
    );
  }
  
  _notifyValues(valuesDct) {
    const activeButtons = new Set(Object.keys(valuesDct).filter(v => valuesDct[v]));
    this.handler(this.state.filter, activeButtons);
    this.setState({currentSelected: valuesDct});
  }
  
  handleClick(e, value) {
    var passValues = {};
    Object.keys(this.state.currentSelected).forEach(v => {
      var active = this.state.currentSelected[v];
      passValues[v] = v === value ? !active : active;
    });
    this._notifyValues(passValues);
  }
  
  render() {
    const {filter, label, type, values} = this.props.data;
    
    return (
      <div className="selections">
        {values.map(this._buildButton)}
      </div>
    );
  }
}
