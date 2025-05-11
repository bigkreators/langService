#!/bin/bash
# startup.sh - Script to run the Extended IPA Symbols Backend with templates

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} Extended IPA Symbols - Backend Startup ${NC}"
echo -e "${BLUE}========================================${NC}"

# Ensure we're in the right directory
if [ ! -d "app" ] || [ ! -d "scripts" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory.${NC}"
    echo "Make sure app and scripts directories exist."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}Virtual environment created.${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Linux/Mac
    source venv/bin/activate
fi

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
else
    echo -e "${YELLOW}requirements.txt not found. Installing essential packages...${NC}"
    pip install fastapi uvicorn sqlalchemy pydantic python-multipart aiofiles jinja2 beautifulsoup4
    pip freeze > requirements.txt
    echo -e "${GREEN}Basic dependencies installed.${NC}"
fi

# Create required directories
echo "Creating required directories..."
mkdir -p templates
mkdir -p static/css
mkdir -p static/js
mkdir -p static/images
mkdir -p audio_files/proposals

# Check if source.html exists and extract phonemes if needed
if [ ! -d "scripts/extended_phonemes.json" ] && [ -f "scripts/source.html" ]; then
    echo -e "${YELLOW}Extracting phoneme data from HTML...${NC}"
    cd scripts
    python -c "
import os
import sys
sys.path.append('..')
try:
    from scripts.extract_extended_phonemes import extract_extended_phonemes
    extract_extended_phonemes()
    print('Extraction completed.')
except Exception as e:
    print(f'Error extracting data: {e}')
"
    cd ..
fi

# Initialize database
echo "Initializing database..."
python -c "
import os
import sys
from sqlalchemy import create_engine, inspect
from pathlib import Path

# Add the current directory to the Python path
sys.path.append('.')

try:
    from app.database import Base, engine
    
    # Import models to register with Base
    from app.models.language import Language
    from app.models.phoneme import Phoneme, PhonemeType
    from app.models.allophone import Allophone
    from app.models.proposal import Proposal
    from app.models.discussion import DiscussionTopic, DiscussionReply
    from app.models.notification import Notification
    
    # Check if database and tables exist
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if len(tables) == 0:
        print('Creating database tables...')
        Base.metadata.create_all(bind=engine)
        print('Database tables created successfully.')
    else:
        print(f'Database already contains {len(tables)} tables.')
except Exception as e:
    print(f'Error initializing database: {e}')
"

# Import data if database is empty
echo "Checking if data needs to be imported..."
python -c "
import os
import sys
sys.path.append('.')

try:
    from app.database import engine, SessionLocal
    from app.models.language import Language
    from sqlalchemy.orm import Session
    
    # Check if any languages exist
    db = SessionLocal()
    language_count = db.query(Language).count()
    db.close()
    
    if language_count == 0:
        print('No languages found. Importing data...')
        
        # Import language
        from scripts.import_extended_ipa import import_extended_phonemes
        import_extended_phonemes()
        
        print('Data import completed.')
    else:
        print(f'Database already contains {language_count} languages. No need to import data.')
except Exception as e:
    print(f'Error checking database content: {e}')
"

# Start the FastAPI server
echo -e "${GREEN}Starting the FastAPI server...${NC}"
echo "The server will be available at http://localhost:8000"
echo "API documentation will be at http://localhost:8000/api/docs"
echo -e "${BLUE}========================================${NC}"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
