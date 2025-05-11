from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
import os
from pathlib import Path

from .routers import languages, phonemes, audio, proposals, discussions, notifications
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

# Define application
app = FastAPI(
    title="Extended IPA Symbols API",
    description="API for Extended IPA Symbols and Phonemic Chart",
    version="1.0.0",
    docs_url="/api/docs",  # Move Swagger docs to /api/docs
    redoc_url="/api/redoc",  # Move ReDoc to /api/redoc
    openapi_url="/api/openapi.json"  # Move OpenAPI schema to /api/openapi.json
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get base directory for static files
BASE_DIR = Path(__file__).resolve().parent.parent

# Mount static files (CSS, JS, etc.)
app.mount("/css", StaticFiles(directory=os.path.join(BASE_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(BASE_DIR, "js")), name="js")
app.mount("/images", StaticFiles(directory=os.path.join(BASE_DIR, "images")), name="images")
app.mount("/audio", StaticFiles(directory=os.path.join(BASE_DIR, "audio_files")), name="audio")

# Setup templates
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Include API routers under /api prefix
app.include_router(languages.router, prefix="/api", tags=["languages"])
app.include_router(phonemes.router, prefix="/api", tags=["phonemes"])
app.include_router(audio.router, prefix="/api", tags=["audio"])
app.include_router(proposals.router, prefix="/api", tags=["proposals"])
app.include_router(discussions.router, prefix="/api", tags=["discussions"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])

@app.get("/static", response_class=HTMLResponse)
async def root(request: Request):
    """
    Serve the main HTML page
    """
    # Check if index.html exists, serve it directly
    index_path = os.path.join(BASE_DIR, "templates", "index.html")
    if os.path.exists(index_path):
        return templates.TemplateResponse("index.html", {"request": request})
    else:
        # Fallback to the original HTML file
        html_path = os.path.join(BASE_DIR, "static", "index.html")
        if os.path.exists(html_path):
            with open(html_path, "r", encoding="utf-8") as f:
                html_content = f.read()
            return HTMLResponse(content=html_content)
        else:
            raise HTTPException(status_code=404, detail="HTML template not found")

@app.get("/api", response_class=HTMLResponse)
async def api_documentation(request: Request):
    """
    Serve the API documentation as HTML
    """
    return templates.TemplateResponse("api.html", {"request": request})

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """
    Serve favicon.ico
    """
    favicon_path = os.path.join(BASE_DIR, "static", "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path)
    else:
        raise HTTPException(status_code=404, detail="Favicon not found")
