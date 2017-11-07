import React, {Component} from 'react';

export default class CheckPanel extends Component {
  constructor(props) {
    super(props);
    
    this.handler = props.handler;
    this._notifyValues = this._notifyValues.bind(this);
    
    this.state = {
      filter: props.data.filter,
      currentSelected: null
    };
  }
  
  _notifyValues(values) {
    this.handler(this.state.filter, values);
    this.setState({currentSelected: values});
  }
  
  render() {
    return (
      <div className="selections">
        
      </div>
    );
  }
}
