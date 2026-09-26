#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "===> Upgrading pip..."
pip install --upgrade pip

echo "===> Installing CPU-optimized PyTorch and Torchvision..."
pip install --no-cache-dir torch==2.3.1 torchvision==0.18.1 --index-url https://download.pytorch.org/whl/cpu

echo "===> Installing remaining dependencies from requirements.txt..."
pip install --no-cache-dir -r requirements.txt

echo "===> Build finished successfully!"
