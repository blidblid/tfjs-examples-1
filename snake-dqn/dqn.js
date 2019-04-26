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

import * as tf from '@tensorflow/tfjs';

/**
 * Create a Deep Q-Network (DQN) for the snake game.
 *
 * @param {number} h Height of the snake game board.
 * @param {number} w Width of the snake game board.
 * @param {number} stateFrames Number of the most recent frames included in the
 *   game's state observation.
 * @param {number} numActions Number of unique actions in the snake game.
 * @return {tf.LayersModel} The created DQN.
 */
export function createDeepQNetwork(h, w, stateFrames, numActions) {
  if (!(Number.isInteger(h) && h > 0)) {
    throw new Error(`Expected height to be a positive integer, but got ${h}`);
  }
  if (!(Number.isInteger(w) && w > 0)) {
    throw new Error(`Expected width to be a positive integer, but got ${w}`);
  }
  if (!(Number.isInteger(stateFrames) && stateFrames > 0)) {
    throw new Error(`Expected stateFrames to be a positive integer, but got ${w}`);
  }
  if (!(Number.isInteger(numActions) && numActions > 1)) {
    throw new Error(
        `Expected numActions to be a integer greater than 1, ` +
        `but got ${numActions}`);
  }

  const model = tf.sequential();
  model.add(tf.layers.conv2d({
    filters: 16,
    kernelSize: 3,
    strides: 1,
    activation: 'relu',
    inputShape: [h, w, 2 * stateFrames]
  }));
  model.add(tf.layers.conv2d({
    filters: 32,
    kernelSize: 3,
    strides: 1,
    activation: 'relu'
  }));
  // model.add(tf.layers.conv2d({
  //   filters: 256,
  //   kernelSize: 3,
  //   strides: 1,
  //   activation: 'relu'
  // }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({units: 256, activation: 'relu'}));
  model.add(tf.layers.dense({units: numActions}));
  model.summary();
  return model;
}

/**
 * Copy the weights from a source deep-Q network to another.
 *
 * @param {tf.LayersModel} destNetwork The destination network of weight
 *   copying.
 * @param {tf.LayersModel} srcNetwork The source network for weight copying.
 */
export function copyWeights(destNetwork, srcNetwork) {
  destNetwork.setWeights(srcNetwork.getWeights());
}
