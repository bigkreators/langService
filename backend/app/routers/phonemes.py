# File: backend/app/routers/phonemes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.phoneme import Phoneme, PhonemeGrid, PhonemeType
from ..models.language import Language
from ..models.phoneme import Phoneme as PhonemeModel, PhonemeType as PhonemeTypeModel

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
        query = query.filter(PhonemeModel.type == PhonemeTypeModel[type.value])
    
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
        if phoneme.type == PhonemeTypeModel.consonant:
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
