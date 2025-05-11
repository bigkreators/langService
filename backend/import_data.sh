#!/bin/bash
# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Linux/Mac
    source venv/bin/activate
fi

echo "Running data extraction script..."
python -m scripts.extract_extended_phonemes

echo "Running data import script..."
python -m scripts.import_extended_ipa

echo "Data import completed."
