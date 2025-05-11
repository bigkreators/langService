#!/bin/bash
# install.sh - Setup script for Extended IPA Backend (without data extraction)

set -e  # Exit on error

echo "========================================"
echo "Extended IPA Backend - Installation Script"
echo "========================================"

# Create project directory structure
echo "Creating directory structure..."
mkdir -p my_extended_ipa_symbols/backend/app/{models,routers,schemas,services}
mkdir -p my_extended_ipa_symbols/backend/audio_files/{english,spanish,french}
mkdir -p my_extended_ipa_symbols/backend/scripts
mkdir -p my_extended_ipa_symbols/backend/tests

# Create virtual environment
echo "Creating Python virtual environment..."
cd my_extended_ipa_symbols
python -m venv env
source env/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-multipart aiofiles python-dotenv beautifulsoup4

# Create requirements.txt
echo "Creating requirements.txt..."
pip freeze > backend/requirements.txt

# Create initial files
echo "Creating initial backend files..."

# Create database.py
cat > backend/app/database.py << 'EOL'
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

# Create __init__.py files
touch backend/app/__init__.py
touch backend/app/models/__init__.py
touch backend/app/routers/__init__.py
touch backend/app/schemas/__init__.py
touch backend/app/services/__init__.py

# Create models
echo "Creating model files..."

# Language model
cat > backend/app/models/language.py << 'EOL'
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
EOL

# Phoneme model
cat > backend/app/models/phoneme.py << 'EOL'
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Boolean, Text
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
    
    # New fields for extended IPA
    is_extended = Column(Boolean, default=False)
    articulation_type = Column(String, nullable=True)
    articulation_place = Column(String, nullable=True)
    impossibility_reason = Column(String, nullable=True)
    
    language = relationship("Language", back_populates="phonemes")
    allophones = relationship("Allophone", back_populates="phoneme")
EOL

# Allophone model
cat > backend/app/models/allophone.py << 'EOL'
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

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
EOL

# Proposal model
cat > backend/app/models/proposal.py << 'EOL'
from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from ..database import Base

class Proposal(Base):
    __tablename__ = "proposals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String, nullable=False)
    sound_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    rationale = Column(Text, nullable=False)
    example_language = Column(String)
    audio_file = Column(String)
    image_file = Column(String)
    submitted_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")
    votes = Column(Integer, default=0)
EOL

# Discussion model
cat > backend/app/models/discussion.py << 'EOL'
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from ..database import Base

class DiscussionTopic(Base):
    __tablename__ = "discussion_topics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    author_name = Column(String)
    author_email = Column(String)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    replies = relationship("DiscussionReply", back_populates="topic")

class DiscussionReply(Base):
    __tablename__ = "discussion_replies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("discussion_topics.id"))
    content = Column(Text, nullable=False)
    author_name = Column(String)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    topic = relationship("DiscussionTopic", back_populates="replies")
EOL

# Notification model
cat > backend/app/models/notification.py << 'EOL'
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from ..database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    related_entity_type = Column(String)  # e.g., "proposal", "discussion"
    related_entity_id = Column(UUID(as_uuid=True))
    is_read = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)
EOL

# Create schemas
echo "Creating schema files..."

# Language schema
cat > backend/app/schemas/language.py << 'EOL'
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
EOL

# Phoneme schema
cat > backend/app/schemas/phoneme.py << 'EOL'
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
    
    # Extended IPA fields
    is_extended: Optional[bool] = False
    articulation_type: Optional[str] = None
    articulation_place: Optional[str] = None
    impossibility_reason: Optional[str] = None

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
    impossible: Optional[List[Phoneme]] = []
EOL

# Proposal schema
cat > backend/app/schemas/proposal.py << 'EOL'
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ProposalBase(BaseModel):
    symbol: str
    sound_name: str
    category: str
    rationale: str
    example_language: Optional[str] = None

class ProposalCreate(ProposalBase):
    pass

class Proposal(ProposalBase):
    id: UUID
    submitted_date: datetime
    status: str
    votes: int
    audio_file: Optional[str] = None
    image_file: Optional[str] = None
    
    class Config:
        orm_mode = True
EOL

# Discussion schema
cat > backend/app/schemas/discussion.py << 'EOL'
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ReplyBase(BaseModel):
    content: str
    author_name: Optional[str] = None

class ReplyCreate(ReplyBase):
    pass

class Reply(ReplyBase):
    id: UUID
    topic_id: UUID
    created_date: datetime
    
    class Config:
        orm_mode = True

class TopicBase(BaseModel):
    title: str
    content: str
    author_name: Optional[str] = None
    author_email: Optional[str] = None

class TopicCreate(TopicBase):
    pass

class Topic(TopicBase):
    id: UUID
    created_date: datetime
    replies: List[Reply] = []
    
    class Config:
        orm_mode = True
EOL

# Notification schema
cat > backend/app/schemas/notification.py << 'EOL'
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: UUID
    is_read: bool
    created_date: datetime
    
    class Config:
        orm_mode = True
EOL

# Create routers
echo "Creating router files..."

# Language router
cat > backend/app/routers/languages.py << 'EOL'
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
EOL

# Phoneme router
cat > backend/app/routers/phonemes.py << 'EOL'
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.phoneme import Phoneme, PhonemeGrid, PhonemeType
from ..models.language import Language
from ..models.phoneme import Phoneme as PhonemeModel, PhonemeType as PhonemeTypeModel

router = APIRouter()

@router.get("/languages/{lang_code}/phonemes", response_model=List[Phoneme])
def get_phonemes(
    lang_code: str, 
    type: Optional[PhonemeType] = None, 
    extended: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    # Get language
    language = db.query(Language).filter(Language.code == lang_code).first()
    if language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Query phonemes
    query = db.query(PhonemeModel).filter(PhonemeModel.language_id == language.id)
    if type:
        query = query.filter(PhonemeModel.type == PhonemeTypeModel[type])
    if extended is not None:
        query = query.filter(PhonemeModel.is_extended == extended)
    
    return query.all()

@router.get("/languages/{lang_code}/phonemic", response_model=PhonemeGrid)
def get_phonemic_grid(lang_code: str, db: Session = Depends(get_db)):
    # Get language
    language = db.query(Language).filter(Language.code == lang_code).first()
    if language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Get phonemes and organize them into a grid
    phonemes = db.query(PhonemeModel).filter(PhonemeModel.language_id == language.id).all()
    
    # Create grid structure
    consonants = []
    vowels = []
    
    # Group by row
    for phoneme in phonemes:
        if phoneme.type == PhonemeTypeModel.consonant and not phoneme.impossibility_reason:
            # Ensure we have enough rows
            while len(consonants) <= phoneme.row_position:
                consonants.append([None] * 10)  # Assuming max 10 columns
                
            # Place in the grid
            while len(consonants[phoneme.row_position]) <= phoneme.column_position:
                consonants[phoneme.row_position].append(None)
                
            consonants[phoneme.row_position][phoneme.column_position] = phoneme
        elif phoneme.type == PhonemeTypeModel.vowel and not phoneme.impossibility_reason:
            # Ensure we have enough rows
            while len(vowels) <= phoneme.row_position:
                vowels.append([None] * 10)  # Assuming max 10 columns
                
            # Place in the grid
            while len(vowels[phoneme.row_position]) <= phoneme.column_position:
                vowels[phoneme.row_position].append(None)
                
            vowels[phoneme.row_position][phoneme.column_position] = phoneme
    
    # Get impossible phonemes
    impossible = db.query(PhonemeModel).filter(
        PhonemeModel.language_id == language.id,
        PhonemeModel.impossibility_reason.isnot(None)
    ).all()
    
    return {"consonants": consonants, "vowels": vowels, "impossible": impossible}

@router.get("/languages/{lang_code}/extended-phonemes", response_model=List[Phoneme])
def get_extended_phonemes(
    lang_code: str, 
    db: Session = Depends(get_db)
):
    """Get all extended IPA phonemes for a specific language."""
    language = db.query(Language).filter(Language.code == lang_code).first()
    if language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    
    phonemes = db.query(PhonemeModel).filter(
        PhonemeModel.language_id == language.id,
        PhonemeModel.is_extended == True
    ).all()
    
    return phonemes

@router.get("/languages/{lang_code}/impossible-phonemes", response_model=List[Phoneme])
def get_impossible_phonemes(
    lang_code: str, 
    db: Session = Depends(get_db)
):
    """Get all impossible phonemes for a specific language."""
    language = db.query(Language).filter(Language.code == lang_code).first()
    if language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    
    phonemes = db.query(PhonemeModel).filter(
        PhonemeModel.language_id == language.id,
        PhonemeModel.impossibility_reason.isnot(None)
    ).all()
    
    return phonemes

@router.get("/phonemes/categories")
def get_phoneme_categories():
    """Get all available phoneme categories and articulation types."""
    articulation_types = [
        "plosive", "nasal", "trill", "tap/flap", "fricative", 
        "lateral fricative", "approximant", "lateral approximant"
    ]
    
    articulation_places = [
        "bilabial", "labiodental", "dental", "alveolar", "postalveolar",
        "retroflex", "palatal", "velar", "uvular", "pharyngeal", "glottal"
    ]
    
    return {
        "articulation_types": articulation_types,
        "articulation_places": articulation_places
    }
EOL

# Audio router
cat > backend/app/routers/audio.py << 'EOL'
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
EOL

# Create main app
cat > backend/app/main.py << 'EOL'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import languages, phonemes, audio
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Extended IPA Symbols API",
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
    return {"message": "Welcome to the Extended IPA Symbols API"}
EOL

# Create Dockerfile
echo "Creating Dockerfile..."
cat > backend/Dockerfile << 'EOL'
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOL

# Create docker-compose.yml
echo "Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOL'
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
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Uncomment if you want to use PostgreSQL instead of SQLite
  # db:
  #   image: postgres:13
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   environment:
  #     - POSTGRES_USER=user
  #     - POSTGRES_PASSWORD=password
  #     - POSTGRES_DB=ipa_symbols
  #   ports:
  #     - "5432:5432"

# Uncomment if using PostgreSQL
# volumes:
#   postgres_data:
EOL

# Create init script
echo "Creating initialization script..."
cat > backend/init.py << 'EOL'
#!/usr/bin/env python
"""
Initialize the backend by creating all tables.
"""
import os
import sys
from sqlalchemy import create_engine
from app.database import Base
from app.models.language import Language
from app.models.phoneme import Phoneme, PhonemeType
from app.models.allophone import Allophone
from app.models.proposal import Proposal
from app.models.discussion import DiscussionTopic, DiscussionReply
from app.models.notification import Notification
import uuid

# Create database engine
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ipa_symbols.db")
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

def init_db():
    print("Creating database tables...")
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")

if __name__ == "__main__":
    init_db()
    print("Database initialization complete!")
EOL

# Make scripts executable
chmod +x backend/init.py

echo "========================================"
echo "Installation complete!"
echo "========================================"
echo "To start the application:"
echo "1. cd my_extended_ipa_symbols"
echo "2. source env/bin/activate"
echo "3. cd backend"
echo "4. python init.py"
echo "5. uvicorn app.main:app --reload"
echo "6. Visit http://localhost:8000/docs in your browser"
echo ""
echo "Note: To import the extended IPA data, use the existing scripts:"
echo "- backend/scripts/extract_extended_phonemes.py"
echo "- backend/scripts/import_extended_ipa.py"
echo "========================================"
