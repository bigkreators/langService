# File: backend/scripts/create_extended_tables.py
import sys
from sqlalchemy import create_engine, Column, Boolean, String, Text
from sqlalchemy.ext.declarative import declarative_base
import os

sys.path.append("..")  # Add parent directory to Python path
from app.database import Base
from app.models.phoneme import Phoneme
from app.models.proposal import Proposal
from app.models.discussion import DiscussionTopic, DiscussionReply
from app.models.notification import Notification

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ipa_symbols.db")

# Create engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

def migrate():
    # Add columns to existing tables
    try:
        # Check if columns already exist
        conn = engine.connect()
        res = conn.execute("PRAGMA table_info(phonemes)")
        columns = [row[1] for row in res.fetchall()]
        
        if "is_extended" not in columns:
            conn.execute("ALTER TABLE phonemes ADD COLUMN is_extended BOOLEAN DEFAULT FALSE")
            
        if "articulation_type" not in columns:
            conn.execute("ALTER TABLE phonemes ADD COLUMN articulation_type VARCHAR")
            
        if "articulation_place" not in columns:
            conn.execute("ALTER TABLE phonemes ADD COLUMN articulation_place VARCHAR")
            
        if "impossibility_reason" not in columns:
            conn.execute("ALTER TABLE phonemes ADD COLUMN impossibility_reason VARCHAR")
            
        conn.close()
        print("Successfully added columns to phonemes table")
    except Exception as e:
        print(f"Error adding columns to phonemes table: {e}")
    
    # Create new tables
    Base.metadata.create_all(engine)
    print("Successfully created new tables")

if __name__ == "__main__":
    migrate()
