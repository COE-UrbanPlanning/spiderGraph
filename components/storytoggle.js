import React, {Component} from 'react';

export default class StoryToggle extends Component {
  constructor(props) {
    super(props);
    
    this.handler = this.props.handler;
    this._notifySelection = this._notifySelection.bind(this);
    
    this.state = {
      selected: 'net'
    };
  }
  
  _notifySelection(selection) {
    if (this.state.selected !== selection) {
      this.state.selected = selection;
      return () => {
        this.handler(selection);
      };
    }
  }
  
  render() {
    return (
      <div id="toggle">
        <div className="filter-button left-button"
          onClick={this._notifySelection('incoming')}>Incoming</div>
        <div className="filter-button middle-button"
          onClick={this._notifySelection('net')}>Net</div>
        <div className="filter-button right-button"
          onClick={this._notifySelection('outgoing')}>Outgoing</div>
      </div>
    );
  }
}