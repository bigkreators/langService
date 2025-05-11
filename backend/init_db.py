#!/usr/bin/env python
"""
Initialize the database by creating all tables and importing initial data.
"""
import os
import sys
from sqlalchemy import create_engine, inspect
import importlib
import argparse

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine

def init_db(force=False):
    """Initialize the database tables."""
    print("Checking database...")
    
    # Import all model files to register them with Base
    for root, dirs, files in os.walk(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app', 'models')):
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                module_path = os.path.join(root, file).replace('/', '.').replace('\\', '.').replace('.py', '')
                module_path = module_path.split('app.')[-1]  # Extract the part after 'app.'
                try:
                    importlib.import_module(f"app.{module_path}")
                    print(f"Imported {module_path}")
                except Exception as e:
                    print(f"Warning: Could not import {module_path}: {e}")
    
    # Check if tables exist
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if len(tables) == 0 or force:
        if force:
            print("Force flag set. Recreating all tables...")
        else:
            print("No tables found. Creating tables...")
        
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    else:
        print(f"Database already contains {len(tables)} tables.")
        print("If you want to recreate all tables, run with --force flag.")

def load_sample_data():
    """Load sample data into the database."""
    from app.models.language import Language
    from sqlalchemy.orm import sessionmaker
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if data exists
        existing_languages = db.query(Language).all()
        if existing_languages:
            print(f"Sample data already exists ({len(existing_languages)} languages found).")
            return
        
        # Sample languages
        languages = [
            {"code": "english", "name": "English"},
            {"code": "spanish", "name": "Spanish"},
            {"code": "french", "name": "French"}
        ]
        
        for lang_data in languages:
            language = Language(**lang_data)
            db.add(language)
        
        db.commit()
        print(f"Added {len(languages)} sample languages to the database.")
    except Exception as e:
        db.rollback()
        print(f"Error loading sample data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Initialize the database.')
    parser.add_argument('--force', action='store_true', help='Force recreate all tables')
    parser.add_argument('--sample', action='store_true', help='Load sample data')
    
    args = parser.parse_args()
    
    init_db(args.force)
    
    if args.sample:
        load_sample_data()
    
    # Ask if user wants to run data extraction and import scripts
    if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extract_extended_phonemes.py')):
        answer = input("Do you want to extract and import extended IPA data? (y/n): ")
        if answer.lower() == 'y':
            print("Running data extraction script...")
            # Use importlib to run the script
            try:
                extract_script = importlib.import_module('scripts.extract_extended_phonemes')
                extract_script.extract_extended_phonemes()
                
                print("Running data import script...")
                import_script = importlib.import_module('scripts.import_extended_ipa')
                import_script.import_extended_phonemes()
                
                print("Data extraction and import complete.")
            except Exception as e:
                print(f"Error during data extraction or import: {e}")
