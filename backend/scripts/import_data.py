# File: backend/scripts/import_data.py
import json
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
sys.path.append("../")  # Add the parent directory to the Python path

from app.database import Base
from app.models.language import Language
from app.models.phoneme import Phoneme, PhonemeType
from app.models.allophone import Allophone

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
