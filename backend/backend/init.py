#!/usr/bin/env python
"""
Initialize the backend by creating all tables and importing initial data.
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
    
    # Check if the user wants to proceed with extracting and importing data
    proceed = input("Do you want to extract and import extended IPA data? (y/n): ")
    if proceed.lower() == 'y':
        # Current working directory
        cwd = os.getcwd()
        
        # Path to extract_extended_phonemes.py
        script_path = os.path.join(cwd, "scripts", "extract_extended_phonemes.py")
        
        # Run extraction script
        if os.system(f"python {script_path}") == 0:
            print("Data extraction successful.")
            
            # Path to import_extended_ipa.py
            import_script_path = os.path.join(cwd, "scripts", "import_extended_ipa.py")
            
            # Run import script
            if os.system(f"python {import_script_path}") == 0:
                print("Data import successful.")
            else:
                print("Data import failed.")
        else:
            print("Data extraction failed.")
