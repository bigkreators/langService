#!/bin/bash
# startup.sh - Fixed startup script for the Extended IPA Symbols Backend

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
if [ ! -d "app" ] || [ ! -f "setup.py" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory.${NC}"
    echo "Make sure you're in the directory containing the 'app' folder and setup.py."
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
    pip install -U pip
    pip install -r requirements.txt
else
    echo -e "${RED}requirements.txt not found.${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
        cp .env.example .env
    else
        echo -e "${YELLOW}Creating basic .env file...${NC}"
        echo "DATABASE_URL=sqlite:///./ipa_symbols.db" > .env
        echo "HOST=0.0.0.0" >> .env
        echo "PORT=8000" >> .env
        echo "RELOAD=true" >> .env
    fi
    echo -e "${GREEN}.env file created. You may want to review it for customization.${NC}"
fi

# Initialize database
echo "Initializing database..."
python init_db.py

# Extract phoneme data if needed
if [ ! -f "scripts/extended_phonemes.json" ]; then
    if [ -f "scripts/source.html" ]; then
        echo -e "${YELLOW}Extracting phoneme data from HTML...${NC}"
        # Make sure the working directory is correct for the script
        cd scripts
        python extract_extended_phonemes.py
        cd ..
    else
        echo -e "${YELLOW}Warning: source.html not found, cannot extract phoneme data.${NC}"
    fi
else
    echo "Phoneme data already exists in scripts directory."
fi

# Import extended IPA data
if [ -f "scripts/extended_phonemes.json" ]; then
    echo "Importing extended IPA data..."
    python -m scripts.import_extended_ipa
fi

# Start the FastAPI server
echo -e "${GREEN}Starting the FastAPI server...${NC}"
echo "The server will be available at http://localhost:8000"
echo "API documentation will be at http://localhost:8000/api/docs"
echo -e "${BLUE}========================================${NC}"
echo "Press Ctrl+C to stop the server"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
