# backend/scripts/import_extended_ipa.py
import json
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
from pathlib import Path

# Add the parent directory to the Python path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
sys.path.insert(0, str(backend_dir))

try:
    from app.database import Base
    from app.models.language import Language
    from app.models.phoneme import Phoneme, PhonemeType
    from app.models.allophone import Allophone
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

# Create engine and session using the same database path as in app/database.py
DATABASE_URL = f"sqlite:///{current_dir}/ipa_symbols.db"
print(f"Using database: {DATABASE_URL}")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)
print("Ensured database tables exist")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def import_extended_phonemes():
    """Import extended phonemes from JSON file into database."""
    # Path to the JSON file in the scripts directory
    json_file = current_dir / "extended_phonemes.json"
    
    if not json_file.exists():
        print(f"Error: Could not find {json_file}. Please run extract_extended_phonemes.py first.")
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
            
            # Import consonants, vowels, and impossible phonemes
            import_count = 0
            
            for phoneme_list in ["consonants", "vowels", "impossible"]:
                for phoneme_data in data.get(phoneme_list, []):
                    # Determine phoneme type
                    phoneme_type = PhonemeType.consonant
                    if phoneme_list == "vowels":
                        phoneme_type = PhonemeType.vowel
                    
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
                            type=phoneme_type,
                            **clean_data
                        )
                        db.add(phoneme)
                        import_count += 1
            
            # Save changes to database
            db.commit()
            print(f"Successfully imported {import_count} phonemes")
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
    import_extended_phonemes()
