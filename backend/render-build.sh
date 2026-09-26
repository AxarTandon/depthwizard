#!/usr/bin/env bash
set -o errexit

echo "===> Upgrading pip..."
pip install --upgrade pip

echo "===> Installing dependencies from requirements.txt..."
pip install --no-cache-dir -r requirements.txt

echo "===> Build completed successfully!"
