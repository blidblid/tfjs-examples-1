#!/usr/bin/env bash

# Copyright 2019 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =============================================================================

# Quantize a specified model saved from the command `yarn train` and evaluates
# the test accuracy under different levels of quantization (8-bit and 16-bit).

set -e

MODEL_NAME=$1
if [[ -z "${MODEL_NAME}" ]]; then
  echo "Usage: quantize_evaluate <MODEL_NAME>"
  exit 1
fi

# Make sure model is available.
MODEL_ROOT="models/${MODEL_NAME}"
MODEL_PATH="${MODEL_ROOT}/original"
MODEL_JSON_PATH="${MODEL_PATH}/model.json"
if [[ ! -f "${MODEL_JSON_PATH}" ]]; then
  echo "ERROR: Cannot find model JSON file at ${MODEL_JSON_PATH}"
  echo "       Make sure you train and save a model with the"
  echo "       following command first: yarn train"
  exit 1
fi

# Make sure pip is available.
if [[ -z "$(which pip)" ]]; then
  echo "ERROR: Cannot find pip on path."
  echo "       Make sure you have python and pip installed."
  exit 1
fi

if [[ -z "$(which virtualenv)" ]]; then
  echo "Installing virtualenv..."
  pip install virtualenv
fi

VENV_DIR="$(mktemp -d)_venv"
echo "Creating virtualenv at ${VENV_DIR} ..."
virtualenv "${VENV_DIR}"
source "${VENV_DIR}/bin/activate"

pip install tensorflowjs

# Perform 16-bit quantization.
MODEL_PATH_16BIT="${MODEL_ROOT}/quantized-16bit"
rm -rf "${MODEL_PATH_16BIT}"
tensorflowjs_converter \
    --input_format tfjs_layers_model \
    --output_format tfjs_layers_model \
    --quantization_bytes 2 \
    "${MODEL_JSON_PATH}" "${MODEL_PATH_16BIT}"

# Perform 8-bit quantization.
MODEL_PATH_8BIT="${MODEL_ROOT}/quantized-8bit"
rm -rf "${MODEL_PATH_8BIT}"
tensorflowjs_converter \
    --input_format tfjs_layers_model \
    --output_format tfjs_layers_model \
    --quantization_bytes 1 \
    "${MODEL_JSON_PATH}" "${MODEL_PATH_8BIT}"

yarn

# Evaluate accuracy under no quantization (i.e., full 32-bit weight precision).
yarn "eval-${MODEL_NAME}" "${MODEL_JSON_PATH}"

# Evaluate accuracy under 16-bit quantization.
yarn "eval-${MODEL_NAME}" "${MODEL_PATH_16BIT}/model.json"

# Evaluate accuracy under 8-bit quantization.
yarn "eval-${MODEL_NAME}" "${MODEL_PATH_8BIT}/model.json"

# Clean up the virtualenv
rm -rf "${VENV_DIR}"
