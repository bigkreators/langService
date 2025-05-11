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
