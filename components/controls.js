import React, {Component} from 'react';

import CheckPanel from './checkpanel.js'
import ContinuousPanel from './continuouspanel.js'
import RangePanel from './rangepanel.js'

export default class Controls extends Component {
  constructor(props) {
    super(props);
    
    this._getFilterComponent = this._getFilterComponent.bind(this);
    
    this.state = {
      filters: props.filters,
      panels: {
        check: this._buildCheckPanel,
        continuous: this._buildContinuousPanel,
        range: this._buildRangePanel
      }
    };
  }
  
  _buildCheckPanel(filter, i) {
    return (
      <CheckPanel key={i} data={filter} handler={this.props.handler}/>
    );
  }
  
  _buildContinuousPanel(filter, i) {
    return (
      <ContinuousPanel key={i} data={filter} handler={this.props.handler}/>
    );
  }
  
  _buildRangePanel(filter, i) {
    return (
      <RangePanel key={i} data={filter} handler={this.props.handler}/>
    );
  }
  
  _getFilterComponent(filter, i) {
    return this.state.panels[filter.type].bind(this)(filter, i);
  }
  
  render() {
    const {filters} = this.state;
    
    return (
      <div id="controls">
        {filters.map(this._getFilterComponent)}
      </div>
    );
  }
}
