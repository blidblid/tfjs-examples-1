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

import {ArgumentParser} from 'argparse';

import {JenaWeatherData} from './data';
import {buildModel, trainModel} from './models';

global.fetch = require('node-fetch');

function parseArguments() {
  const parser =
      new ArgumentParser({description: 'Train RNNs for Jena weather problem'});
  parser.addArgument('--modelType', {
    type: 'string',
    defaultValue: 'gru',
    optionStrings: ['gru', 'gru-dropout'],
    // TODO(cais): Add more.
    help: 'Model type to use'
  });
  parser.addArgument('--gpu', {
    action: 'storeTrue',
    help: 'Use GPU'
  });
  parser.addArgument('--lookBack', {
    type: 'int',
    defaultValue: 10 * 24 * 6,
    help: 'Look-back period (# of rows) for generating features'
  });
  parser.addArgument('--step', {
    type: 'int',
    defaultValue: 6,
    help: 'Step size (# of rows) used for generating features'
  });
  parser.addArgument('--delay', {
    type: 'int',
    defaultValue: 24 * 6,
    help: 'How many steps (# of rows) in the future to predict the ' +
        'temperature for'
  });
  parser.addArgument('--normalize', {
    defaultValue: true,
    help: 'Used normalized feature values (default: true)'
  });
  parser.addArgument('--includeDateTime', {
    action: 'storeTrue',
    help: 'Used date and time features (default: false)'
  });
  parser.addArgument(
      '--batchSize',
      {type: 'int', defaultValue: 128, help: 'Batch size for training'});
  parser.addArgument(
      '--epochs',
      {type: 'int', defaultValue: 20, help: 'Number of training epochs'});
  parser.addArgument('--displayEvery', {
    type: 'int',
    defaultValue: 10,
    help: 'Log info to the console every _ batches'
  });
  return parser.parseArgs();
}

async function main() {
  const args = parseArguments();
  if (args.gpu) {
    console.log('Using GPU for training.');
    require('@tensorflow/tfjs-node-gpu');
  } else {
    console.log('Using CPU for training.');
    require('@tensorflow/tfjs-node');
  }

  const jenaWeatherData = new JenaWeatherData();
  console.log(`Loading Jena weather data...`);
  await jenaWeatherData.load();

  let numFeatures = jenaWeatherData.getDataColumnNames().length;
  const model = buildModel(
      args.modelType, Math.floor(args.lookBack / args.step), numFeatures);

  await trainModel(
      model, jenaWeatherData, args.normalize, args.includeDateTime,
      args.lookBack, args.step, args.delay, args.batchSize, args.epochs,
      args.displayEvery);
}

main();
