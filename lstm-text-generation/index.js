/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
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

/**
 * TensorFlow.js Example: LSTM Text Generation.
 *
 * Inspiration comes from:
 *
 * - https://github.com/keras-team/keras/blob/master/examples/lstm_text_generation.py
 * - Andrej Karpathy. "The Unreasonable Effectiveness of Recurrent Neural Networks"
 *   http://karpathy.github.io/2015/05/21/rnn-effectiveness/
 */

import * as tf from '@tensorflow/tfjs';

import {setUpUI} from './ui';

setUpUI();
