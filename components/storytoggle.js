import React, {Component} from 'react';

export default class StoryToggle extends Component {
  constructor(props) {
    super(props);
    
    this.handler = this.props.handler;
    this._notifySelection = this._notifySelection.bind(this);
    this._getButtonClass = this._getButtonClass.bind(this);
  }
  
  _getButtonClass(position, selection) {
    var classes = `filter-button ${position}-button`;
    if (this.props.selected === selection) {
      classes += ' selected';
    }
    return classes;
  }
  
  _notifySelection(selection) {
    return () => {
      this.handler(selection);
    };
  }
  
  render() {
    return (
      <div id="toggle">
        <div className={this._getButtonClass('left', 'incoming')}
          onClick={this._notifySelection('incoming')}>Incoming</div>
        <div className={this._getButtonClass('middle', 'net')}
          onClick={this._notifySelection('net')}>Net</div>
        <div className={this._getButtonClass('right', 'outgoing')}
          onClick={this._notifySelection('outgoing')}>Outgoing</div>
      </div>
    );
  }
}