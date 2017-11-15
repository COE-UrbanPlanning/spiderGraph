import React, {Component} from 'react';

export default class StoryToggle extends Component {
  constructor(props) {
    super(props);
    
    this.handler = this.props.toggleHandler;
    
    this.state = {
      selected: 'net'
    };
  }
  
  _selectIncoming() {
    
  }
  
  _selectNet() {
    
  }
  
  _selectOutgoing() {
    
  }
  
  _notifySelection(selection) {
    
  }
  
  render() {
    return (
      <div id="toggle">
        <div className="filter-button left-button"
          onClick={this._selectIncoming.bind(this)}>Incoming</div>
        <div className="filter-button middle-button"
          onClick={this._selectNet.bind(this)}>Net</div>
        <div className="filter-button right-button"
          onClick={this._selectOutgoing.bind(this)}>Outgoing</div>
      </div>
    );
  }
}