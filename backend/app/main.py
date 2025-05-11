# backend/app/main.py
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
import os
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session

from .routers import languages, phonemes, audio, proposals, discussions, notifications
from .database import engine, Base, get_db
from .models.notification import Notification
from .models.discussion import DiscussionTopic
from .models.proposal import Proposal
from .models.phoneme import Phoneme, PhonemeType
from .models.language import Language

# Create database tables
Base.metadata.create_all(bind=engine)

# Define application
app = FastAPI(
    title="Extended IPA Symbols API",
    description="API for Extended IPA Symbols and Phonemic Chart",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get base directory for static files
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

# Mount static files
app.mount("/css", StaticFiles(directory=os.path.join(STATIC_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(STATIC_DIR, "js")), name="js")
app.mount("/images", StaticFiles(directory=os.path.join(STATIC_DIR, "images")), name="images")
app.mount("/audio", StaticFiles(directory=os.path.join(STATIC_DIR, "audio")), name="audio")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Setup templates
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Include API routers
app.include_router(languages.router, prefix="/api", tags=["languages"])
app.include_router(phonemes.router, prefix="/api", tags=["phonemes"])
app.include_router(audio.router, prefix="/api", tags=["audio"])
app.include_router(proposals.router, prefix="/api", tags=["proposals"])
app.include_router(discussions.router, prefix="/api", tags=["discussions"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])

def organize_phonemes(phonemes, phoneme_type):
    """
    Organize phonemes into a grid for display in templates
    """
    if phoneme_type == PhonemeType.consonant:
        # Define consonant grid structure
        rows = [
            "Nasal", "Plosive", "Implosive", "Sibilant fricative", 
            "Non-sibilant fricative", "Approximant", "Flap", "Trill", 
            "Fricative trill", "Lateral approximant"
        ]
        
        # Initialize grid
        grid = [[{"manner": row} for _ in range(28)] for row in rows]
        
        # Place phonemes in grid
        for phoneme in phonemes:
            if phoneme.row_position < len(rows) and phoneme.column_position < 28:
                cell = {
                    "symbol": phoneme.symbol,
                    "manner": rows[phoneme.row_position],
                    "description": phoneme.description,
                    "audio_url": phoneme.audio_file,
                    "impossible": phoneme.impossibility_reason is not None
                }
                grid[phoneme.row_position][phoneme.column_position] = cell
    
    elif phoneme_type == PhonemeType.vowel:
        # Define vowel grid structure
        rows = ["Near-close", "Mid", "Near-open", "Open"]
        
        # Initialize grid
        grid = [[{"height": row} for _ in range(6)] for row in rows]
        
        # Place phonemes in grid
        for phoneme in phonemes:
            if phoneme.row_position < len(rows) and phoneme.column_position < 6:
                cell = {
                    "symbol": phoneme.symbol,
                    "height": rows[phoneme.row_position],
                    "description": phoneme.description,
                    "audio_url": phoneme.audio_file,
                }
                grid[phoneme.row_position][phoneme.column_position] = cell
    
    return grid

@app.get("/", response_class=HTMLResponse)
async def root(request: Request, db: Session = Depends(get_db)):
    """
    Serve the main HTML page with dynamic data from the database
    """
    # Get language (default to English)
    language = db.query(Language).filter(Language.code == "english").first()
    if not language:
        language_id = None
    else:
        language_id = language.id
    
    # Get phoneme data
    consonants = db.query(Phoneme).filter(
        Phoneme.language_id == language_id,
        Phoneme.type == PhonemeType.consonant,
        Phoneme.impossibility_reason == None,
        Phoneme.is_extended == True
    ).all()
    
    vowels = db.query(Phoneme).filter(
        Phoneme.language_id == language_id,
        Phoneme.type == PhonemeType.vowel,
        Phoneme.is_extended == True
    ).all()
    
    impossible_phonemes = db.query(Phoneme).filter(
        Phoneme.language_id == language_id,
        Phoneme.impossibility_reason != None
    ).all()
    
    # Get special phonemes for "Other ones" sections
    other_consonants = []
    for consonant in consonants:
        # Use criteria to decide if it should be in "Other ones"
        if consonant.description and ("bunched" in consonant.description.lower() or 
                                     "click" in consonant.description.lower() or
                                     "compressed" in consonant.description.lower() or
                                     "creaky" in consonant.description.lower() or
                                     "lateral approximant" in consonant.description.lower()):
            other_consonants.append(consonant)
    
    other_vowels = []
    for vowel in vowels:
        if "near-" in vowel.description.lower() or "close" in vowel.description.lower():
            other_vowels.append(vowel)
    
    # Organize phonemes into grids
    consonant_grid = organize_phonemes(consonants, PhonemeType.consonant)
    vowel_grid = organize_phonemes(vowels, PhonemeType.vowel)
    impossible_grid = organize_phonemes(impossible_phonemes, PhonemeType.consonant)
    
    # Get proposals
    proposals = db.query(Proposal).order_by(Proposal.submitted_date.desc()).all()
    
    # Get discussion topics
    topics = db.query(DiscussionTopic).order_by(DiscussionTopic.created_date.desc()).all()
    
    # Get notifications
    all_notifications = db.query(Notification).order_by(Notification.created_date.desc()).all()
    unread_count = db.query(Notification).filter(Notification.is_read == False).count()
    
    # Format dates and times for template
    current_date = datetime.now().strftime('%B %d, %Y')
    
    # Prepare context data for template
    context = {
        "request": request,
        "consonants": consonant_grid,
        "vowels": vowel_grid,
        "impossible_consonants": impossible_grid,
        "other_consonants": other_consonants,
        "other_vowels": other_vowels,
        "proposals": proposals,
        "topics": topics,
        "notifications": all_notifications[:3],  # Only send the 3 most recent for initial display
        "unread_notifications": unread_count,
        "current_date": current_date,
        "current_language": "english"
    }
    
    return templates.TemplateResponse("index.html", context)

@app.get("/api", response_class=HTMLResponse)
async def api_documentation(request: Request):
    """
    Serve the API documentation as HTML
    """
    if os.path.exists(os.path.join(BASE_DIR, "templates", "api.html")):
        return templates.TemplateResponse("api.html", {"request": request})
    else:
        raise HTTPException(status_code=404, detail="API documentation not found")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """
    Serve favicon.ico
    """
    favicon_path = os.path.join(STATIC_DIR, "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path)
    else:
        raise HTTPException(status_code=404, detail="Favicon not found")
