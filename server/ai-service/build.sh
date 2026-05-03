#!/bin/bash
apt-get update -y
apt-get install -y tesseract-ocr tesseract-ocr-nep tesseract-ocr-eng tesseract-ocr-hin
pip install -r requirements.txt
echo "✅ Build complete"