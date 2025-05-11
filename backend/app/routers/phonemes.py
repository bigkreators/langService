# File: backend/app/routers/phonemes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.phoneme import Phoneme, PhonemeGrid
from ..models.language import Language
from ..models.phoneme import Phoneme as PhonemeModel, PhonemeType

router = APIRouter()

# Existing routes...

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
