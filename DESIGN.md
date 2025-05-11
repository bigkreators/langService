# Backend Service for Extended IPA Symbols Application

This document outlines the plan for creating a backend service for the phonemic chart application. The backend will handle data storage and audio file serving, replacing the current GitHub Pages static hosting with a dynamic solution.

## Architecture Overview

```
my_extended_ipa_symbols/
├── backend/                      # Python FastAPI server
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI application entry point
│   │   ├── models/               # Database models
│   │   │   ├── __init__.py
│   │   │   ├── language.py
│   │   │   ├── phoneme.py
│   │   │   └── allophone.py
│   │   ├── routers/              # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── languages.py
│   │   │   ├── phonemes.py
│   │   │   └── audio.py
│   │   ├── schemas/              # Pydantic models for request/response
│   │   │   ├── __init__.py 
│   │   │   ├── language.py
│   │   │   └── phoneme.py
│   │   ├── services/             # Business logic
│   │   │   ├── __init__.py
│   │   │   └── audio_service.py
│   │   └── database.py           # Database connection
│   ├── audio_files/              # Storage for audio files
│   │   ├── english/
│   │   ├── spanish/
│   │   └── ...
│   ├── requirements.txt          # Dependencies
│   └── Dockerfile                # For containerization
├── frontend/                     # Your existing frontend code
└── docker-compose.yml            # For local development
```

## Database Schema

```
Language
- id: UUID
- code: String (e.g., 'english', 'spanish')
- name: String (e.g., 'English', 'Spanish')

PhonemeType
- id: UUID
- name: String (e.g., 'consonant', 'vowel')

Phoneme
- id: UUID
- language_id: UUID (Foreign key to Language)
- type_id: UUID (Foreign key to PhonemeType)
- symbol: String
- ipa: String
- example: String
- description: String
- audio_file: String (path to audio file)
- row_position: Integer
- column_position: Integer

Allophone
- id: UUID
- phoneme_id: UUID (Foreign key to Phoneme)
- symbol: String
- environment: String
- example: String
- description: String
- audio_file: String (path to audio file)
```

## API Endpoints

```
GET /api/languages - List all languages
GET /api/languages/{lang_code} - Get specific language details

GET /api/languages/{lang_code}/phonemes - Get all phonemes for a language
GET /api/languages/{lang_code}/phonemes/{phoneme_id} - Get specific phoneme
GET /api/languages/{lang_code}/phonetic - Get phonetic view data

GET /api/audio/{lang_code}/{filename} - Serve audio file
```

## Implementation Details

### 1. FastAPI Main Application

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import languages, phonemes, audio
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IPA Symbols API",
    description="API for Extended IPA Symbols and Phonemic Chart",
    version="1.0.0"
)

# Configure CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-production-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(languages.router, prefix="/api", tags=["languages"])
app.include_router(phonemes.router, prefix="/api", tags=["phonemes"])
app.include_router(audio.router, prefix="/api", tags=["audio"])

@app.get("/")
async def root():
    return {"message": "Welcome to the IPA Symbols API"}
```

### 2. Database Setup

```python
# backend/app/database.py
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
```

### 3. Models

```python
# backend/app/models/language.py
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class Language(Base):
    __tablename__ = "languages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    
    phonemes = relationship("Phoneme", back_populates="language")

# backend/app/models/phoneme.py
from sqlalchemy import Column, String, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from ..database import Base

class PhonemeType(enum.Enum):
    consonant = "consonant"
    vowel = "vowel"

class Phoneme(Base):
    __tablename__ = "phonemes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_id = Column(UUID(as_uuid=True), ForeignKey("languages.id"))
    type = Column(Enum(PhonemeType))
    symbol = Column(String)
    ipa = Column(String)
    example = Column(String)
    description = Column(String)
    audio_file = Column(String)
    row_position = Column(Integer)
    column_position = Column(Integer)
    
    language = relationship("Language", back_populates="phonemes")
    allophones = relationship("Allophone", back_populates="phoneme")

class Allophone(Base):
    __tablename__ = "allophones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phoneme_id = Column(UUID(as_uuid=True), ForeignKey("phonemes.id"))
    symbol = Column(String)
    environment = Column(String)
    example = Column(String)
    description = Column(String)
    audio_file = Column(String)
    
    phoneme = relationship("Phoneme", back_populates="allophones")
```

### 4. Pydantic Schemas for Validation

```python
# backend/app/schemas/language.py
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class LanguageBase(BaseModel):
    code: str
    name: str

class LanguageCreate(LanguageBase):
    pass

class Language(LanguageBase):
    id: UUID
    
    class Config:
        orm_mode = True

# backend/app/schemas/phoneme.py
from pydantic import BaseModel
from typing import List, Optional, Union
from uuid import UUID
from enum import Enum

class PhonemeType(str, Enum):
    consonant = "consonant"
    vowel = "vowel"

class AllophoneBase(BaseModel):
    symbol: str
    environment: str
    example: str
    description: str
    audio_file: Optional[str]

class AllophoneCreate(AllophoneBase):
    pass

class Allophone(AllophoneBase):
    id: UUID
    phoneme_id: UUID
    
    class Config:
        orm_mode = True

class PhonemeBase(BaseModel):
    symbol: str
    ipa: str
    example: str
    description: str
    type: PhonemeType
    row_position: int
    column_position: int
    audio_file: Optional[str]

class PhonemeCreate(PhonemeBase):
    language_code: str

class Phoneme(PhonemeBase):
    id: UUID
    language_id: UUID
    allophones: List[Allophone] = []
    
    class Config:
        orm_mode = True

class PhonemeGrid(BaseModel):
    consonants: List[List[Optional[Phoneme]]]
    vowels: List[List[Optional[Phoneme]]]
```

### 5. API Routes

```python
# backend/app/routers/languages.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.language import Language
from ..models.language import Language as LanguageModel

router = APIRouter()

@router.get("/languages", response_model=List[Language])
def get_languages(db: Session = Depends(get_db)):
    return db.query(LanguageModel).all()

@router.get("/languages/{lang_code}", response_model=Language)
def get_language(lang_code: str, db: Session = Depends(get_db)):
    language = db.query(LanguageModel).filter(LanguageModel.code == lang_code).first()
    if language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    return language

# backend/app/routers/phonemes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.phoneme import Phoneme, PhonemeGrid
from ..models.language import Language
from ..models.phoneme import Phoneme as PhonemeModel, PhonemeType

router = APIRouter()

@router.get("/languages/{lang_code}/phonemes", response_model=List[Phoneme])
def get_phonemes(lang_code: str, type: Optional[PhonemeType] = None, db: Session = Depends(get_db)):
    # Get language
    language = db.query(Language).filter(Language.code == lang_code).first()
    if language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Query phonemes
    query = db.query(PhonemeModel).filter(PhonemeModel.language_id == language.id)
    if type:
        query = query.filter(PhonemeModel.type == type)
    
    return query.all()

@router.get("/languages/{lang_code}/phonemic", response_model=PhonemeGrid)
def get_phonemic_grid(lang_code: str, db: Session = Depends(get_db)):
    # Get language
    language = db.query(Language).filter(Language.code == lang_code).first()
    if language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Get phonemes and organize them into a grid
    phonemes = db.query(PhonemeModel).filter(PhonemeModel.language_id == language.id).all()
    
    # This is where you'd implement the logic to organize phonemes into a grid
    # similar to your frontend data structure
    # This is a simplified implementation - you'll need to adapt based on your data
    
    consonants = []
    vowels = []
    
    # Group by row
    for phoneme in phonemes:
        if phoneme.type == PhonemeType.consonant:
            # Ensure we have enough rows
            while len(consonants) <= phoneme.row_position:
                consonants.append([None] * 10)  # Assuming max 10 columns
                
            # Place in the grid
            consonants[phoneme.row_position][phoneme.column_position] = phoneme
        else:
            # Ensure we have enough rows
            while len(vowels) <= phoneme.row_position:
                vowels.append([None] * 10)  # Assuming max 10 columns
                
            # Place in the grid
            vowels[phoneme.row_position][phoneme.column_position] = phoneme
    
    return {"consonants": consonants, "vowels": vowels}

# backend/app/routers/audio.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

AUDIO_DIR = "audio_files"

@router.get("/audio/{lang_code}/{filename}")
async def get_audio(lang_code: str, filename: str):
    file_path = os.path.join(AUDIO_DIR, lang_code, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(file_path)
```

### 6. Requirements

```
# backend/requirements.txt
fastapi>=0.95.0
uvicorn>=0.21.1
sqlalchemy>=2.0.7
pydantic>=1.10.7
python-multipart>=0.0.6
aiofiles>=23.1.0
python-dotenv>=1.0.0
# Use either
psycopg2-binary>=2.9.5  # For PostgreSQL
# or
sqlite3  # For SQLite (included in Python standard library)
```

### 7. Data Import Script

```python
# backend/scripts/import_data.py
import json
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
sys.path.append("../")  # Add the parent directory to the Python path

from app.database import Base
from app.models.language import Language
from app.models.phoneme import Phoneme, PhonemeType, Allophone

# Create database connection
engine = create_engine("sqlite:///./ipa_symbols.db")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Load data from JSON file (converted from your existing data)
with open("phoneme_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

db = SessionLocal()

# Import languages
for lang_code, lang_data in data.items():
    # Check if language already exists
    language = db.query(Language).filter(Language.code == lang_code).first()
    if not language:
        language = Language(code=lang_code, name=lang_code.capitalize())
        db.add(language)
        db.commit()
    
    # Import phonemes
    for phoneme_type in ["consonants", "vowels"]:
        type_enum = PhonemeType.consonant if phoneme_type == "consonants" else PhonemeType.vowel
        
        for row_idx, row in enumerate(lang_data[phoneme_type]):
            for col_idx, phoneme_data in enumerate(row):
                if phoneme_data:
                    # Check if phoneme already exists
                    phoneme = db.query(Phoneme).filter(
                        Phoneme.language_id == language.id,
                        Phoneme.symbol == phoneme_data["symbol"]
                    ).first()
                    
                    if not phoneme:
                        phoneme = Phoneme(
                            language_id=language.id,
                            type=type_enum,
                            symbol=phoneme_data["symbol"],
                            ipa=phoneme_data.get("ipa", phoneme_data["symbol"]),
                            example=phoneme_data.get("example", ""),
                            description=phoneme_data.get("description", ""),
                            audio_file=phoneme_data.get("audio", ""),
                            row_position=row_idx,
                            column_position=col_idx
                        )
                        db.add(phoneme)
                        db.commit()
                    
                    # If we have phonetic data, import allophones
                    if "allophones" in phoneme_data:
                        for allophone_data in phoneme_data["allophones"]:
                            allophone = Allophone(
                                phoneme_id=phoneme.id,
                                symbol=allophone_data["symbol"],
                                environment=allophone_data.get("environment", ""),
                                example=allophone_data.get("example", ""),
                                description=allophone_data.get("description", ""),
                                audio_file=allophone_data.get("audio", "")
                            )
                            db.add(allophone)
                        db.commit()

print("Data import completed!")
```

### 8. Docker Setup

```dockerfile
# backend/Dockerfile
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - ./backend/audio_files:/app/audio_files
    environment:
      - DATABASE_URL=sqlite:///./ipa_symbols.db
      # Use this for PostgreSQL:
      # - DATABASE_URL=postgresql://user:password@db:5432/ipa_symbols
    depends_on:
      - db
  
  # Uncomment if using PostgreSQL
  # db:
  #   image: postgres:13
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   environment:
  #     - POSTGRES_USER=user
  #     - POSTGRES_PASSWORD=password
  #     - POSTGRES_DB=ipa_symbols

  frontend:
    image: node:16
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    working_dir: /app
    command: npm start
    depends_on:
      - backend

# Uncomment if using PostgreSQL
# volumes:
#   postgres_data:
```

## Frontend Integration Example

```jsx
// Example of updated React component
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PhonemeChart = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [activePhoneme, setActivePhoneme] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [phonemeData, setPhonemeData] = useState({ consonants: [], vowels: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_BASE_URL = 'http://localhost:8000/api';
  
  // Fetch languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/languages`);
        setLanguages(response.data);
      } catch (err) {
        setError('Failed to load languages');
        console.error(err);
      }
    };
    
    fetchLanguages();
  }, []);
  
  // Fetch phoneme data when language changes
  useEffect(() => {
    const fetchPhonemeData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/languages/${selectedLanguage}/phonemic`);
        setPhonemeData(response.data);
        setActivePhoneme(null);
        setError(null);
      } catch (err) {
        setError('Failed to load phoneme data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedLanguage) {
      fetchPhonemeData();
    }
  }, [selectedLanguage]);
  
  // Handle language selection
  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
  };
  
  // Handle phoneme click
  const handlePhonemeClick = (phoneme) => {
    setActivePhoneme(phoneme);
  };
  
  // Play audio
  const playAudio = (audioFile) => {
    if (!audioFile) return;
    
    const audio = new Audio(`${API_BASE_URL}/audio/${selectedLanguage}/${audioFile}`);
    audio.play().catch(err => console.error('Error playing audio:', err));
  };
  
  // ... rest of your component code
};
```

## Deployment Options

### 1. VPS/Cloud Service (Recommended)

- **Setup**:
  - Deploy on AWS EC2, DigitalOcean Droplet, or similar
  - Use Docker for containerization
  - Set up a PostgreSQL database for production
  - Configure Nginx as a reverse proxy

- **Benefits**:
  - Full control over server configuration
  - Easy scaling
  - Efficient for serving audio files
  - Can set up CI/CD pipelines

- **Example AWS Architecture**:
  - EC2 instance running the FastAPI application
  - RDS PostgreSQL database
  - S3 bucket for audio file storage (optional)
  - CloudFront for audio file distribution (optional)
  - ALB for load balancing (for scaling)

### 2. Platform as a Service

- **Setup**:
  - Deploy the backend on Heroku, Render, or Railway
  - Use their PostgreSQL add-ons
  - Store audio files on AWS S3 or similar storage service

- **Benefits**:
  - Simpler deployment
  - Managed database
  - Less server maintenance

- **Considerations**:
  - Higher costs at scale
  - Less control
  - May require additional setup for audio file serving

### 3. Serverless

- **Setup**:
  - Convert backend to AWS Lambda functions with API Gateway
  - Use a service like DynamoDB for data storage
  - Store audio files in S3

- **Benefits**:
  - Cost-effective for low-traffic applications
  - Scalability handled automatically
  - No server management

- **Considerations**:
  - More complex setup
  - Cold start latency
  - May require additional configuration for audio file access

## Next Steps

1. **Data Migration**:
   - Convert your existing phoneme data to the format needed by the database
   - Write a script to import audio files to the appropriate directories

2. **Development**:
   - Implement the basic backend using FastAPI
   - Create tests for API endpoints
   - Update the frontend to use the new API

3. **Admin Interface**:
   - Create admin interfaces for managing language data and audio files
   - Add authentication for admin users

4. **Deployment**:
   - Set up Docker containers for development and production
   - Choose and configure a deployment target
   - Set up a CI/CD pipeline for automated testing and deployment

5. **Monitoring and Maintenance**:
   - Add logging and error tracking
   - Set up monitoring for the application
   - Create a backup strategy for the database and audio files
