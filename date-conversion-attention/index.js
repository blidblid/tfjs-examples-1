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
 * Addition RNN example.
 *
 * Based on Python Keras example:
 *   https://github.com/keras-team/keras/blob/master/examples/addition_rnn.py
 */

import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

import {INPUT_LENGTH, INPUT_FNS, generateRandomDateTuple} from './date_format';
import {runSeq2SeqInference} from './model';

const inputDateString = document.getElementById('input-date-string');
const outputDateString = document.getElementById('output-date-string');
const inferenceTime = document.getElementById('inference-time');
const attentionHeatmap = document.getElementById('attention-heatmap');
const randomButton = document.getElementById('random-date');

let model;

inputDateString.addEventListener('change', async () => {
  let inputStr = inputDateString.value.trim().toUpperCase();
  if (inputStr.length < 6) {
    outputDateString.value = '';
    return;
  }

  if (inputStr.length > INPUT_LENGTH) {
    inputStr = inputStr.slice(0, INPUT_LENGTH);
  }

  try {
    const getAttention = true;
    const t0 = tf.util.now();
    const {outputStr, attention} =
        await runSeq2SeqInference(model, inputStr, getAttention);
    const tElapsed = tf.util.now() - t0;
    inferenceTime.textContent = `seq2seq onversion took ${tElapsed.toFixed(1)} ms`;
    outputDateString.value = outputStr;

    const xLabels = outputStr.split('').map((char, i) => `(${i + 1}) "${char}"`);
    const yLabels = [];
    for (let i = 0; i < INPUT_LENGTH; ++i) {
      if (i < inputStr.length) {
        yLabels.push(`(${i + 1}) "${inputStr[i]}"`);
      } else {
        yLabels.push(`(${i + 1}) ""`);
      }
    }
    await tfvis.render.heatmap({
      values: attention.squeeze([0]),
      xLabels,
      yLabels
    }, attentionHeatmap, {
      width: 600,
      height: 360,
      xLabel: 'Output characters',
      yLabel: 'Input characters',
      colorMap: 'blues'
    });
  } catch (err) {
    outputDateString.value = err.message;
    console.error(err);
  }
});

randomButton.addEventListener('click', async () => {
  const inputFn = INPUT_FNS[Math.floor(Math.random() * INPUT_FNS.length)];
  inputDateString.value = inputFn(generateRandomDateTuple());
  inputDateString.dispatchEvent(new Event('change'));
});

async function init() {
  outputDateString.value = 'Loading model...';

  model = await tf.loadModel('./model/model.json');
  model.summary();

  const exampleItems = document.getElementsByClassName('input-date-example');
  for (const exampleItem of exampleItems) {
    exampleItem.addEventListener('click', (event) => {
      inputDateString.value = event.srcElement.textContent;
      inputDateString.dispatchEvent(new Event('change'));
    });
  }

  inputDateString.dispatchEvent(new Event('change'));
}

init();
