import json
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

sys.path.append("..")  # Add parent directory to Python path
from app.database import Base
from app.models.language import Language
from app.models.phoneme import Phoneme, PhonemeType

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ipa_symbols.db")

# Create engine and session
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def import_extended_phonemes():
    """Import extended phonemes from JSON file into database."""
    # Load data from JSON file
    with open("extended_phonemes.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    db = SessionLocal()
    
    try:
        # Get or create English language
        language = db.query(Language).filter(Language.code == "english").first()
        if not language:
            language = Language(
                id=uuid.uuid4(),
                code="english", 
                name="English"
            )
            db.add(language)
            db.commit()
            db.refresh(language)
        
        # Import consonants
        for phoneme_data in data["consonants"]:
            # Check if phoneme already exists
            phoneme = db.query(Phoneme).filter(
                Phoneme.language_id == language.id,
                Phoneme.symbol == phoneme_data["symbol"]
            ).first()
            
            if not phoneme:
                phoneme = Phoneme(
                    id=uuid.uuid4(),
                    language_id=language.id,
                    type=PhonemeType.consonant,
                    **{k: v for k, v in phoneme_data.items() if k != "type"}
                )
                db.add(phoneme)
        
        # Import vowels
        for phoneme_data in data["vowels"]:
            # Check if phoneme already exists
            phoneme = db.query(Phoneme).filter(
                Phoneme.language_id == language.id,
                Phoneme.symbol == phoneme_data["symbol"]
            ).first()
            
            if not phoneme:
                phoneme = Phoneme(
                    id=uuid.uuid4(),
                    language_id=language.id,
                    type=PhonemeType.vowel,
                    **{k: v for k, v in phoneme_data.items() if k != "type"}
                )
                db.add(phoneme)
        
        # Import impossible phonemes
        for phoneme_data in data["impossible"]:
            # Check if phoneme already exists
            phoneme = db.query(Phoneme).filter(
                Phoneme.language_id == language.id,
                Phoneme.symbol == phoneme_data["symbol"]
            ).first()
            
            if not phoneme:
                phoneme = Phoneme(
                    id=uuid.uuid4(),
                    language_id=language.id,
                    type=PhonemeType.consonant,  # Default to consonant
                    **{k: v for k, v in phoneme_data.items() if k != "type"}
                )
                db.add(phoneme)
        
        db.commit()
        print(f"Successfully imported extended phonemes")
    except Exception as e:
        db.rollback()
        print(f"Error importing extended phonemes: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import_extended_phonemes()
