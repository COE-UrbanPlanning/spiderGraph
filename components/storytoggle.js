import React, {Component} from 'react';

export default class StoryToggle extends Component {
  constructor(props) {
    super(props);
    
  }
  
  render() {
    return (
      <div id="toggle">
        <div className="filter-button left-button">Incoming</div>
        <div className="filter-button middle-button">Outgoing</div>
        <div className="filter-button right-button">Net</div>
      </div>
    );
  }
}