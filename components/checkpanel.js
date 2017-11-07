import React, {Component} from 'react';

export default class CheckPanel extends Component {
  constructor(props) {
    super(props);
    
    this.handler = props.handler;
    this._notifyValues = this._notifyValues.bind(this);
    
    this.state = {
      filter: props.data.filter,
      values: props.data.values,
      currentSelected: null
    };
  }
  
  handleClick(button) {
    
  }
  
  _buildButton(value, i) {
    return (<div key={i}></div>);
    // return (
      // <div
        // className="filter-button"
        // onClick={this.handleClick}>
        // {}
      // </div>
    // );
  }
  
  _notifyValues(values) {
    this.handler(this.state.filter, values);
    this.setState({currentSelected: values});
  }
  
  render() {
    return (
      <div className="selections">
        {this.state.values.map(this._buildButton)}
      </div>
    );
  }
}
