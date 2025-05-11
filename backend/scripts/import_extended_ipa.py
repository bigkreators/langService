# File: backend/scripts/import_extended_ipa.py
import json
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

# Add the parent directory to Python path to find app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)  # Backend directory
sys.path.insert(0, backend_dir)

try:
    # Import the database stuff
    from app.database import Base
    
    # Import all necessary models to ensure they are registered with SQLAlchemy
    from app.models.language import Language
    from app.models.phoneme import Phoneme, PhonemeType
    from app.models.allophone import Allophone
except ImportError as e:
    print(f"Error importing modules: {e}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Backend directory: {backend_dir}")
    print(f"Python path: {sys.path}")
    sys.exit(1)

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ipa_symbols.db")
print(f"Using database: {DATABASE_URL}")

# Create engine and session
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)
print("Ensured database tables exist")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def import_extended_phonemes(json_file="extended_phonemes.json"):
    """Import extended phonemes from JSON file into database."""
    # Check if the file exists
    if not os.path.exists(json_file):
        # Try to look in different directories
        possible_paths = [
            json_file,
            os.path.join("scripts", json_file),
            os.path.join("..", json_file),
            os.path.join("backend", "scripts", json_file),
            os.path.join("backend", json_file),
            os.path.join(current_dir, json_file),
        ]
        
        found = False
        for path in possible_paths:
            if os.path.exists(path):
                json_file = path
                found = True
                print(f"Found JSON file at: {json_file}")
                break
        
        if not found:
            print(f"Error: Could not find {json_file}. Please make sure the file exists.")
            return
    
    try:
        # Load data from JSON file
        with open(json_file, "r", encoding="utf-8") as f:
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
                print("Created 'English' language entry")
            else:
                print("Found existing 'English' language entry")
            
            # Import consonants
            consonant_count = 0
            for phoneme_data in data["consonants"]:
                # Check if phoneme already exists
                phoneme = db.query(Phoneme).filter(
                    Phoneme.language_id == language.id,
                    Phoneme.symbol == phoneme_data["symbol"]
                ).first()
                
                if not phoneme:
                    # Create a clean copy of the data without type
                    clean_data = {k: v for k, v in phoneme_data.items() if k != "type"}
                    
                    phoneme = Phoneme(
                        id=uuid.uuid4(),
                        language_id=language.id,
                        type=PhonemeType.consonant,
                        **clean_data
                    )
                    db.add(phoneme)
                    consonant_count += 1
            
            # Import vowels
            vowel_count = 0
            for phoneme_data in data["vowels"]:
                # Check if phoneme already exists
                phoneme = db.query(Phoneme).filter(
                    Phoneme.language_id == language.id,
                    Phoneme.symbol == phoneme_data["symbol"]
                ).first()
                
                if not phoneme:
                    # Create a clean copy of the data without type
                    clean_data = {k: v for k, v in phoneme_data.items() if k != "type"}
                    
                    phoneme = Phoneme(
                        id=uuid.uuid4(),
                        language_id=language.id,
                        type=PhonemeType.vowel,
                        **clean_data
                    )
                    db.add(phoneme)
                    vowel_count += 1
            
            # Import impossible phonemes
            impossible_count = 0
            for phoneme_data in data["impossible"]:
                # Check if phoneme already exists
                phoneme = db.query(Phoneme).filter(
                    Phoneme.language_id == language.id,
                    Phoneme.symbol == phoneme_data["symbol"]
                ).first()
                
                if not phoneme:
                    # Create a clean copy of the data without type
                    clean_data = {k: v for k, v in phoneme_data.items() if k != "type"}
                    
                    phoneme = Phoneme(
                        id=uuid.uuid4(),
                        language_id=language.id,
                        type=PhonemeType.consonant,  # Default to consonant
                        **clean_data
                    )
                    db.add(phoneme)
                    impossible_count += 1
            
            # Save changes to database
            db.commit()
            print(f"Successfully imported {consonant_count} consonants, {vowel_count} vowels, and {impossible_count} impossible phonemes")
        except Exception as e:
            db.rollback()
            print(f"Error during database operations: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()
    except json.JSONDecodeError:
        print(f"Error: The file {json_file} is not valid JSON.")
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Check if a filename was provided as a command-line argument
    if len(sys.argv) > 1:
        import_extended_phonemes(sys.argv[1])
    else:
        import_extended_phonemes()
