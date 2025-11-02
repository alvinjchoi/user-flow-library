"""
Configuration for UIED Detection Service
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Server Configuration
PORT = int(os.getenv("PORT", 5000))
HOST = os.getenv("HOST", "0.0.0.0")

# CORS Configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001"
).split(",")

# UIED Configuration
UIED_MIN_CONFIDENCE = float(os.getenv("UIED_MIN_CONFIDENCE", 0.7))
UIED_OUTPUT_DIR = os.getenv("UIED_OUTPUT_DIR", "./output")

# OCR Configuration
ENABLE_OCR = os.getenv("ENABLE_OCR", "true").lower() == "true"
TESSERACT_PATH = os.getenv("TESSERACT_PATH", "/usr/bin/tesseract")

# Temp directory for downloaded images
TEMP_DIR = os.getenv("TEMP_DIR", "./temp")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(UIED_OUTPUT_DIR, exist_ok=True)

