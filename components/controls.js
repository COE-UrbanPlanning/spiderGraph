import React, {Component} from 'react';

import CheckPanel from './checkpanel.js';
import ContinuousPanel from './continuouspanel.js';
import RangePanel from './rangepanel.js';
import StoryToggle from './storytoggle.js';

export default class Controls extends Component {
  constructor(props) {
    super(props);
    
    this._getFilterComponent = this._getFilterComponent.bind(this);
    
    this.state = {
      panels: {
        check: this._buildCheckPanel,
        continuous: this._buildContinuousPanel,
        range: this._buildRangePanel
      }
    };
  }
  
  _buildCheckPanel(filter) {
    return (
      <CheckPanel data={filter} handler={this.props.filterHandler} />
    );
  }
  
  _buildContinuousPanel(filter) {
    return (
      <ContinuousPanel data={filter} handler={this.props.filterHandler} />
    );
  }
  
  _buildRangePanel(filter) {
    return (
      <RangePanel data={filter} handler={this.props.filterHandler} />
    );
  }
  
  _getFilterComponent(filter, i) {
    return (
      <div key={i}>
        <h3>{filter.label}</h3>
        {this.state.panels[filter.type].bind(this)(filter, i)}
      </div>
    );
  }
  
  render() {
    const {toggleHandler: handler, toggleSelected: selected, filters} = this.props;
    
    if (!filters) {
      return null;
    }
    
    return (
      <div id="controls">
        <div id="filters">
          {filters.map(this._getFilterComponent)}
        </div>
        <StoryToggle
          handler={handler}
          selected={selected} />
      </div>
    );
  }
}
