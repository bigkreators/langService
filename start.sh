#!/bin/bash
# start.sh - Startup script for Extended IPA Symbols Backend

set -e  # Exit on error

# Set text colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}Extended IPA Symbols - Backend Startup${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed.${NC}"
    echo "Please install Python 3 and try again."
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo -e "${YELLOW}Warning: 'backend' directory not found in current location.${NC}"
    
    # Check if we're already in the backend directory
    if [ -f "app/main.py" ]; then
        echo "Looks like you're already in the backend directory."
        BACKEND_DIR="."
    else
        # Ask user if they want to create the directory structure
        read -p "Do you want to create the directory structure here? (y/n): " CREATE_DIR
        if [[ $CREATE_DIR == "y" ]]; then
            mkdir -p backend/app/{models,routers,schemas,services}
            mkdir -p backend/audio_files/{english,spanish,french}
            mkdir -p backend/scripts
            mkdir -p backend/tests
            BACKEND_DIR="backend"
            echo -e "${GREEN}Directory structure created.${NC}"
        else
            echo "Please navigate to the project root directory and try again."
            exit 1
        fi
    fi
else
    BACKEND_DIR="backend"
fi

# Navigate to backend directory
cd $BACKEND_DIR

# Check if virtual environment exists, create if it doesn't
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating one...${NC}"
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

# Fix requirements.txt if it exists and contains sqlite3
if [ -f "requirements.txt" ]; then
    echo "Checking requirements.txt for issues..."
    if grep -q "sqlite3" requirements.txt; then
        echo -e "${YELLOW}Found 'sqlite3' in requirements.txt. This is part of the Python standard library and doesn't need to be installed.${NC}"
        # Create a temporary file with the corrected content
        grep -v "sqlite3" requirements.txt > requirements.txt.tmp
        # Add a comment about sqlite3
        echo "# sqlite3 is included in Python standard library, no need to install it separately" >> requirements.txt.tmp
        # Replace the original file
        mv requirements.txt.tmp requirements.txt
        echo -e "${GREEN}Fixed requirements.txt file.${NC}"
    fi
fi

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Installing dependencies from requirements.txt..."
    pip install -r requirements.txt
else
    echo -e "${YELLOW}requirements.txt not found. Installing basic dependencies...${NC}"
    pip install fastapi uvicorn sqlalchemy pydantic python-multipart aiofiles python-dotenv beautifulsoup4 psycopg2-binary
    # Create requirements.txt
    pip freeze > requirements.txt
    echo -e "${GREEN}Basic dependencies installed and requirements.txt created.${NC}"
fi

# Check and create necessary files if they don't exist
if [ ! -f "app/database.py" ]; then
    echo -e "${YELLOW}database.py not found. Creating essential files...${NC}"
    
    # Create __init__.py files
    touch app/__init__.py
    mkdir -p app/models app/routers app/schemas app/services
    touch app/models/__init__.py
    touch app/routers/__init__.py
    touch app/schemas/__init__.py
    touch app/services/__init__.py
    
    # Create database.py
    cat > app/database.py << 'EOL'
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Use environment variables for configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ipa_symbols.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOL

    # Create a basic main.py if it doesn't exist
    if [ ! -f "app/main.py" ]; then
        cat > app/main.py << 'EOL'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Extended IPA Symbols API",
    description="API for Extended IPA Symbols and Phonemic Chart",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the Extended IPA Symbols API"}
EOL
    fi
    
    echo -e "${GREEN}Essential files created.${NC}"
fi

# Create or initialize database
if [[ -f "app/models/language.py" && -f "app/models/phoneme.py" ]]; then
    echo "Checking if database needs to be initialized..."
    
    # Create a temporary Python script to initialize the database
    cat > init_db_temp.py << 'EOL'
import os
import sys
from sqlalchemy import create_engine, inspect
from importlib import import_module

# Add the current directory to the path so we can import app modules
sys.path.append('.')

try:
    from app.database import Base, engine
    
    # Import all model files to register them with Base
    for root, dirs, files in os.walk('app/models'):
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                module_path = os.path.join(root, file).replace('/', '.').replace('\\', '.').replace('.py', '')
                try:
                    import_module(module_path)
                except Exception as e:
                    print(f"Warning: Could not import {module_path}: {e}")
    
    # Check if tables exist
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if len(tables) == 0:
        print("No tables found. Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    else:
        print(f"Database already contains {len(tables)} tables.")
except Exception as e:
    print(f"Error initializing database: {e}")
EOL
    
    # Run the script
    python init_db_temp.py
    rm init_db_temp.py
else
    echo -e "${YELLOW}Model files not found. Database initialization skipped.${NC}"
    echo "You can run the initialization script later with: python -m scripts.init_db"
fi

# Check for init.py script and offer to run it if this is first time startup
# We'll use a marker file to check if this is the first run
FIRST_RUN_MARKER=".first_run_completed"
if [ -f "init.py" ] && [ ! -f $FIRST_RUN_MARKER ]; then
    echo -e "${YELLOW}First time startup detected. The init.py script may help with additional setup.${NC}"
    read -p "Do you want to run the init.py script? (y/n): " RUN_INIT
    if [[ $RUN_INIT == "y" ]]; then
        python init.py
    fi
    # Create marker file
    touch $FIRST_RUN_MARKER
fi

# Check for and create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file with default settings..."
    cat > .env << 'EOL'
# Database configuration
DATABASE_URL=sqlite:///./ipa_symbols.db
# For PostgreSQL, uncomment and configure:
# DATABASE_URL=postgresql://user:password@localhost:5432/ipa_symbols

# Server configuration
HOST=0.0.0.0
PORT=8000
RELOAD=true
WORKERS=1

# CORS configuration
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8080"]
EOL
    echo -e "${GREEN}.env file created with default settings.${NC}"
fi

# Check for empty database and offer data import only if database is empty
DB_FILE="backend/scripts/ipa_symbols.db"
if [ -f "$DB_FILE" ]; then
    # Use sqlite3 to check if the phonemes table exists and is empty
    PHONEME_COUNT=$(sqlite3 $DB_FILE "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='phonemes';" 2>/dev/null || echo "0")
    
    if [ "$PHONEME_COUNT" = "1" ]; then
        # Table exists, check if it's empty
        ROWS=$(sqlite3 $DB_FILE "SELECT COUNT(*) FROM phonemes;" 2>/dev/null || echo "0")
        
        if [ "$ROWS" = "0" ] && [ -f "scripts/extract_extended_phonemes.py" ] && [ -f "scripts/import_extended_ipa.py" ]; then
            echo -e "${YELLOW}Database exists but appears to be empty. Data import is available.${NC}"
            read -p "Do you want to import extended IPA data? (y/n): " IMPORT_DATA
            if [[ $IMPORT_DATA == "y" ]]; then
                echo "Running data extraction script..."
                python -m scripts.extract_extended_phonemes
                echo "Running data import script..."
                python -m scripts.import_extended_ipa
            fi
        else
            echo "Database already contains data. Skipping data import."
        fi
    elif [ -f "scripts/extract_extended_phonemes.py" ] && [ -f "scripts/import_extended_ipa.py" ]; then
        # Let the user know that they can import data separately
        echo -e "${YELLOW}Data import scripts are available.${NC}"
        echo "If you want to import extended IPA data, you can run these commands separately:"
        echo "python -m scripts.extract_extended_phonemes"
        echo "python -m scripts.import_extended_ipa"
    fi
elif [ -f "scripts/extract_extended_phonemes.py" ] && [ -f "scripts/import_extended_ipa.py" ]; then
    # Database doesn't exist yet, but import scripts are available
    echo -e "${YELLOW}First-time database setup detected. Data import is available.${NC}"
    read -p "Do you want to import extended IPA data? (y/n): " IMPORT_DATA
    if [[ $IMPORT_DATA == "y" ]]; then
        echo "Running data extraction script..."
        python -m scripts.extract_extended_phonemes
        echo "Running data import script..."
        python -m scripts.import_extended_ipa
    fi
fi

# Create import data script for convenience
if [ ! -f "import_data.sh" ] && [ -f "scripts/extract_extended_phonemes.py" ] && [ -f "scripts/import_extended_ipa.py" ]; then
    echo "Creating import_data.sh script for convenient data import..."
    cat > import_data.sh << 'EOL'
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
EOL
    chmod +x import_data.sh
    echo -e "${GREEN}Created import_data.sh script for convenient data import.${NC}"
fi

# Start the server
echo -e "${GREEN}Starting the FastAPI server...${NC}"
echo "The server will be available at http://localhost:8000"
echo "API documentation will be at http://localhost:8000/docs"
echo -e "${BLUE}=======================================${NC}"
echo "Press Ctrl+C to stop the server."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
