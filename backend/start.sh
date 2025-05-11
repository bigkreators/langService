#!/bin/bash
# startup.sh - Simplified startup script for the Extended IPA Symbols Backend

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
if [ ! -d "app" ] || [ ! -d "scripts" ] || [ ! -d "static" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory.${NC}"
    echo "Make sure app, scripts, and static directories exist."
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
    pip install fastapi uvicorn sqlalchemy pydantic python-multipart aiofiles beautifulsoup4
    pip freeze > requirements.txt
    echo -e "${GREEN}Basic dependencies installed.${NC}"
fi

# Ensure scripts directory exists
mkdir -p scripts

# Extract phoneme data from HTML if needed
if [ ! -f "scripts/extended_phonemes.json" ]; then
    echo -e "${YELLOW}Phoneme data not found. Extracting from HTML...${NC}"
    python -m scripts.extract_extended_phonemes
else
    echo "Phoneme data already exists in scripts directory."
fi

# Initialize database
echo "Initializing database..."
python - << EOF
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
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    else:
        print(f"Database already contains {len(tables)} tables.")
except Exception as e:
    print(f"Error initializing database: {e}")
EOF

# Import data if needed
SCRIPTS_DIR="scripts"
DB_FILE="$SCRIPTS_DIR/ipa_symbols.db"

if [ -f "$DB_FILE" ]; then
    # Check if phonemes table exists but is empty
    PHONEME_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM phonemes;" 2>/dev/null || echo "0")
    
    if [ "$PHONEME_COUNT" = "0" ]; then
        echo -e "${YELLOW}Database exists but phonemes table is empty. Importing data...${NC}"
        python -m scripts.import_extended_ipa
    else
        echo "Database already contains phoneme data."
    fi
else
    echo -e "${YELLOW}Database not found. Importing data...${NC}"
    python -m scripts.import_extended_ipa
fi

# Start the FastAPI server
echo -e "${GREEN}Starting the FastAPI server...${NC}"
echo "The server will be available at http://localhost:8000"
echo "API documentation will be at http://localhost:8000/api/docs"
echo -e "${BLUE}========================================${NC}"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
