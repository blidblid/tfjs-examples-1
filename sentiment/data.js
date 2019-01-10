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
import * as fs from 'fs';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';

import {padSequences} from './sequence_utils';

const extract = require('extract-zip');

const DATA_ZIP_URL =
    'https://storage.googleapis.com/learnjs-data/imdb/imdb_tfjs_data.zip';
const METADATA_TEMPLATE_URL =
    'https://storage.googleapis.com/learnjs-data/imdb/metadata.json.zip';

const PAD_CHAR = 0;
const OOV_CHAR = 2;
const INDEX_FROM = 3;

function loadFeatures(filePath, numWords, maxLen) {
  const buffer = fs.readFileSync(filePath);
  const numBytes = buffer.byteLength;

  let sequences = [];
  let seq = [];
  let index = 0;

  while (index < numBytes) {
    const value = buffer.readInt32LE(index);
    if (value === 1) {
      // A new sequence has started.
      if (index > 0) {
        sequences.push(seq);
      }
      seq = [];
    } else {
      // Sequence continues.
      seq.push(value >= numWords ? OOV_CHAR : value);
    }
    index += 4;
  }
  if (seq.length > 0) {
    sequences.push(seq);
  }
  const paddedSequences =
      padSequences(sequences, maxLen, 'pre', 'pre', PAD_CHAR);
  return tf.tensor2d(
      paddedSequences, [paddedSequences.length, maxLen], 'int32');
}

function loadTargets(filePath) {
  const buffer = fs.readFileSync(filePath);
  const numBytes = buffer.byteLength;

  let ys = [];
  for (let i = 0; i < numBytes; ++i) {
    ys.push(buffer.readUInt8(i));
  }
  return tf.tensor2d(ys, [ys.length, 1], 'float32');
}

async function maybeDownload(sourceURL, destPath) {
  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(destPath) || fs.lstatSync(destPath).size === 0) {
      const localZipFile = fs.createWriteStream(destPath);
      console.log(`Downloading file from ${sourceURL} ...`);
      https.get(sourceURL, response => {
        response.pipe(localZipFile);
        localZipFile.on('finish', () => {
          localZipFile.close(async () => {
            return resolve();
          });
        });
        localZipFile.on('error', err => {
          return reject(err);
        });
      });
    } else {
      return resolve();
    }
  });
}

async function maybeExtract(sourcePath, destDir) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destDir)) {
      return resolve();
    }
    console.log(`Extracting: ${sourcePath} --> ${destDir}`);
    extract(sourcePath, {dir: destDir}, err => {
      if (err == null) {
        return resolve();
      } else {
        return reject(err);
      }
    });
  });
}

async function maybeDownloadAndExtract() {
  const zipDownloadDest = path.join(os.tmpdir(), path.basename(DATA_ZIP_URL));
  await maybeDownload(DATA_ZIP_URL, zipDownloadDest);

  const zipExtractDir = zipDownloadDest.slice(0, zipDownloadDest.length - 4);
  await maybeExtract(zipDownloadDest, zipExtractDir);
  return zipExtractDir;
}

export async function loadData(numWords, len) {
  const dataDir = await maybeDownloadAndExtract();

  const trainFeaturePath = path.join(dataDir, 'imdb_train_data.bin');
  const xTrain = loadFeatures(trainFeaturePath, numWords, len);
  const testFeaturePath = path.join(dataDir, 'imdb_test_data.bin');
  const xTest = loadFeatures(testFeaturePath, numWords, len);
  const trainTargetsPath = path.join(dataDir, 'imdb_train_targets.bin');
  const yTrain = loadTargets(trainTargetsPath);
  const testTargetsPath = path.join(dataDir, 'imdb_test_targets.bin');
  const yTest = loadTargets(testTargetsPath);

  tf.util.assert(
      xTrain.shape[0] === yTrain.shape[0],
      `Mismatch in number of examples between xTrain and yTrain`);
  tf.util.assert(
      xTest.shape[0] === yTest.shape[0],
      `Mismatch in number of examples between xTest and yTest`);
  return {xTrain, yTrain, xTest, yTest};
}

export async function loadMetadataTemplate() {
  const baseName = path.basename(METADATA_TEMPLATE_URL);
  const zipDownloadDest = path.join(os.tmpdir(), baseName);
  await maybeDownload(METADATA_TEMPLATE_URL, zipDownloadDest);

  const zipExtractDir = zipDownloadDest.slice(0, zipDownloadDest.length - 4);
  await maybeExtract(zipDownloadDest, zipExtractDir);

  return JSON.parse(fs.readFileSync(
      path.join(zipExtractDir, baseName.slice(0, baseName.length - 4))));
}
