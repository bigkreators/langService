# File: backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
import os

# Import your routers
try:
    from .routers import languages, phonemes, audio
    from .database import engine, Base
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    has_routers = True
except ImportError:
    # Handle case where routers are not yet defined
    has_routers = False

app = FastAPI(
    title="Extended IPA Symbols API",
    description="API for Extended IPA Symbols and Phonemic Chart",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Mount static files directory if it exists
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

audio_files_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "audio_files")
if os.path.exists(audio_files_dir):
    app.mount("/audio_files", StaticFiles(directory=audio_files_dir), name="audio_files")

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html>
        <head>
            <title>Extended IPA Symbols API</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #333;
                }
                h1 {
                    color: #2563eb;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 10px;
                }
                .card {
                    background: #f9fafb;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .endpoints {
                    list-style-type: none;
                    padding: 0;
                }
                .endpoints li {
                    margin-bottom: 10px;
                    padding: 10px;
                    background: #fff;
                    border-radius: 4px;
                    border-left: 4px solid #2563eb;
                }
                a {
                    color: #2563eb;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
                .buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }
                .button {
                    display: inline-block;
                    background: #2563eb;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 4px;
                    text-decoration: none;
                }
                .button:hover {
                    background: #1d4ed8;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <h1>Welcome to the Extended IPA Symbols API</h1>
            
            <div class="card">
                <h2>About</h2>
                <p>This API provides access to Extended IPA (International Phonetic Alphabet) symbols, phonemes, and associated audio files.</p>
                <p>It includes regular IPA symbols as well as extensions and even "impossible" phonemes that can't be produced by human articulatory organs.</p>
            </div>
            
            <div class="card">
                <h2>API Documentation</h2>
                <p>Explore the full API documentation to see all available endpoints and test them interactively.</p>
                <div class="buttons">
                    <a href="/docs" class="button">OpenAPI Documentation</a>
                    <a href="/redoc" class="button">ReDoc Documentation</a>
                </div>
            </div>
            
            <div class="card">
                <h2>Key Endpoints</h2>
                <ul class="endpoints">
                    <li><strong>GET /api/languages</strong> - List all languages</li>
                    <li><strong>GET /api/languages/{lang_code}/phonemes</strong> - Get all phonemes for a language</li>
                    <li><strong>GET /api/languages/{lang_code}/extended-phonemes</strong> - Get extended IPA phonemes</li>
                    <li><strong>GET /api/languages/{lang_code}/impossible-phonemes</strong> - Get impossible phonemes</li>
                    <li><strong>GET /api/audio/{lang_code}/{filename}</strong> - Get audio file</li>
                </ul>
            </div>
        </body>
    </html>
    """

@app.get("/api")
async def api_root():
    """API information endpoint"""
    return {
        "message": "Extended IPA Symbols API",
        "version": "1.0.0",
        "documentation": "/docs",
        "endpoints": {
            "languages": "/api/languages",
            "phonemes": "/api/languages/{lang_code}/phonemes",
            "extended_phonemes": "/api/languages/{lang_code}/extended-phonemes",
            "impossible_phonemes": "/api/languages/{lang_code}/impossible-phonemes",
            "audio": "/api/audio/{lang_code}/{filename}"
        }
    }

# Include routers if they are available
if has_routers:
    app.include_router(languages.router, prefix="/api", tags=["languages"])
    app.include_router(phonemes.router, prefix="/api", tags=["phonemes"])
    app.include_router(audio.router, prefix="/api", tags=["audio"])
