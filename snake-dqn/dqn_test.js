/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tf from '@tensorflow/tfjs-node';

import {createDeepQNetwork, copyWeights} from "./dqn";
import {NUM_ACTIONS} from './snake_game';

describe('createDeepQNetwork', () => {
  it('createDeepQNetwork', () => {
    const h = 9;
    const w = 9;
    const model = createDeepQNetwork(h, w, 1, NUM_ACTIONS);

    expect(model.inputs.length).toEqual(1);
    expect(model.inputs[0].shape).toEqual([null, h, w, 2]);
    expect(model.outputs.length).toEqual(1);
    expect(model.outputs[0].shape).toEqual([null, NUM_ACTIONS]);
  });

  it('Invalid h and/or w leads to Error', () => {
    expect(() => createDeepQNetwork(0, 10, 1, 4)).toThrowError(/height/);
    expect(() => createDeepQNetwork('10', 10, 1, 4)).toThrowError(/height/);
    expect(() => createDeepQNetwork(null, 10, 1, 4)).toThrowError(/height/);
    expect(() => createDeepQNetwork(undefined, 10, 1, 4)).toThrowError(/height/);
    expect(() => createDeepQNetwork(10.8, 10, 1, 4)).toThrowError(/height/);
    expect(() => createDeepQNetwork(10, 0, 1, 4)).toThrowError(/width/);
    expect(() => createDeepQNetwork(10, '10', 1, 4)).toThrowError(/width/);
    expect(() => createDeepQNetwork(10, null, 1, 4)).toThrowError(/width/);
    expect(() => createDeepQNetwork(10, undefined, 4)).toThrowError(/width/);
    expect(() => createDeepQNetwork(10, 10.8, 1, 4)).toThrowError(/width/);
  });

  it('Invali numActions leads to Error', () => {
    expect(() => createDeepQNetwork(10, 10, 1, 0)).toThrowError(/numActions/);
    expect(() => createDeepQNetwork(10, 10, 1, 1)).toThrowError(/numActions/);
    expect(() => createDeepQNetwork(10, 10, 1, '4')).toThrowError(/numActions/);
    expect(() => createDeepQNetwork(10, 10, 1, null)).toThrowError(/numActions/);
    expect(() => createDeepQNetwork(10, 10, 1, undefined)).toThrowError(/numActions/);
  });
});

describe('copyWeights', () => {
  it('copyWeights', async () => {
    const h = 9;
    const w = 9;
    const onlineNetwork = createDeepQNetwork(h, w, 1, NUM_ACTIONS);
    const targetNetwork = createDeepQNetwork(h, w, 1, NUM_ACTIONS);
    onlineNetwork.compile({
      loss: 'meanSquaredError',
      optimizer: tf.train.sgd(0.1)
    });

    // Initially, the two networks should have different values in their
    // weights.
    const onlineWeights0 = onlineNetwork.getWeights();
    const targetWeights0 = targetNetwork.getWeights();
    expect(onlineWeights0.length).toEqual(targetWeights0.length);
    // The 1st weight is the first conv layer's kernel.
    expect(onlineWeights0[0].sub(targetWeights0[0]).abs().mean().arraySync())
        .toBeGreaterThan(0);
    // Skip the 2nd weight, because it's the bias of the first conv layer's
    // kernel, which has an all-zero initializer.
    // The 3rd weight is the second conv layer's kernel.
    expect(onlineWeights0[2].sub(targetWeights0[2]).abs().mean().arraySync())
        .toBeGreaterThan(0);

    copyWeights(targetNetwork, onlineNetwork);

    // After the copying, all the weights should be equal between the two
    // networks.
    const onlineWeights1 = onlineNetwork.getWeights();
    const targetWeights1 = targetNetwork.getWeights();
    expect(onlineWeights1.length).toEqual(targetWeights1.length);
    expect(onlineWeights1.length).toEqual(onlineWeights0.length);
    for (let i = 0; i < onlineWeights1.length; ++i) {
      expect(onlineWeights1[i].sub(targetWeights1[i]).abs().mean().arraySync())
          .toEqual(0);
    }

    // Modifying source network weight should not change target network weight.
    const xs =
        tf.randomUniform([4].concat(onlineNetwork.inputs[0].shape.slice(1)));
    const ys =
        tf.randomUniform([4].concat(onlineNetwork.outputs[0].shape.slice(1)));
    await onlineNetwork.fit(xs, ys, {epochs: 1});

    const onlineWeights2 = onlineNetwork.getWeights();
    const targetWeights2 = targetNetwork.getWeights();
    expect(onlineWeights2.length).toEqual(targetWeights2.length);
    for (let i = 0; i < onlineWeights1.length; ++i) {
      // Verify that the target network's weights haven't changed from before,
      // even though the online network's weights have.
      expect(onlineWeights2[0].sub(targetWeights2[0]).abs().mean().arraySync())
          .toBeGreaterThan(0);
      expect(targetWeights2[0].sub(targetWeights1[0]).abs().mean().arraySync())
          .toEqual(0);
    }
  });
});
