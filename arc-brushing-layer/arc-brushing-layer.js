// Copyright (c) 2015-2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {ArcLayer} from 'deck.gl';

import arcVertex from './arc-brushing-layer-vertex.glsl';
import arcFragment from './arc-brushing-layer-fragment.glsl';

const defaultProps = {
  ...ArcLayer.defaultProps,
  enableBrushing: true,
  getStrokeWidth: d => d.strokeWidth,
  getSourceID: d => Number(d.sourceID),
  getTargetID: d => Number(d.targetID)
};

export default class ArcBrushingLayer extends ArcLayer {

  initializeState() {
    super.initializeState();
    
    const {attributeManager} = this.state;
    
    attributeManager.addInstanced({
      instanceSource: {size: 1, accessor: 'getSourceID', update: this.getInstanceSource},
      instanceTarget: {size: 1, accessor: 'getTargetID', update: this.getInstanceTarget}
    });
  }

  getShaders() {
    // use customized shaders
    return Object.assign({}, super.getShaders(), {
      vs: arcVertex,
      fs: arcFragment
    });
  }

  draw({uniforms}) {
    // add uniforms
    super.draw({uniforms: {
      ...uniforms,
      featureID: this.props.featureID ? Number(this.props.featureID) : -1,
      enableBrushing: this.props.enableBrushing ? 1 : 0
    }});
  }
  
  getInstanceSource(attribute) {
    const {data, getSourceID} = this.props;
    const {value} = attribute;
    
    for (var i = 0; i < data.length; i++) {
      value[i] = getSourceID(data[i]);
    }
  }
  
  getInstanceTarget(attribute) {
    const {data, getTargetID} = this.props;
    const {value} = attribute;
    
    for (var i = 0; i < data.length; i++) {
      value[i] = getTargetID(data[i]);
    }
  }
}

ArcBrushingLayer.layerName = 'ArcBrushingLayer';
ArcBrushingLayer.defaultProps = defaultProps;
