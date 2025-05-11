"""
Setup script for the Extended IPA Symbols backend.
This script guides users through the installation process and initial setup.
"""
import os
import sys
import shutil
from pathlib import Path
import subprocess

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).resolve().parent

def setup():
    print("=" * 60)
    print("Extended IPA Symbols Backend - Setup Script")
    print("=" * 60)
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 7):
        print("Error: Python 3.7 or higher is required.")
        print(f"Current Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
        return
    
    print(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro} (✓)")
    
    # Create virtual environment
    print("\nStep 1: Setting up virtual environment")
    print("-" * 60)
    
    venv_dir = SCRIPT_DIR / "venv"
    if venv_dir.exists():
        print("Virtual environment already exists.")
        recreate = input("Do you want to recreate it? (y/n): ").strip().lower()
        if recreate == 'y':
            shutil.rmtree(venv_dir)
            print("Creating virtual environment...")
            subprocess.run([sys.executable, "-m", "venv", str(venv_dir)])
            print("Virtual environment created.")
        else:
            print("Using existing virtual environment.")
    else:
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", str(venv_dir)])
        print("Virtual environment created.")
    
    # Determine the Python executable path in the virtual environment
    if os.name == 'nt':  # Windows
        venv_python = venv_dir / "Scripts" / "python.exe"
        venv_pip = venv_dir / "Scripts" / "pip.exe"
    else:  # Unix/Linux/Mac
        venv_python = venv_dir / "bin" / "python"
        venv_pip = venv_dir / "bin" / "pip"
    
    # Install dependencies
    print("\nStep 2: Installing dependencies")
    print("-" * 60)
    
    requirements_file = SCRIPT_DIR / "requirements.txt"
    if not requirements_file.exists():
        print("Error: requirements.txt not found.")
        return
    
    print("Installing dependencies...")
    subprocess.run([str(venv_pip), "install", "-U", "pip"])
    subprocess.run([str(venv_pip), "install", "-r", str(requirements_file)])
    print("Dependencies installed.")
    
    # Create .env file if it doesn't exist
    print("\nStep 3: Setting up environment variables")
    print("-" * 60)
    
    env_file = SCRIPT_DIR / ".env"
    env_example_file = SCRIPT_DIR / ".env.example"
    
    if env_file.exists():
        print(".env file already exists.")
    else:
        if env_example_file.exists():
            shutil.copy(env_example_file, env_file)
            print(".env file created from .env.example.")
        else:
            print("Warning: .env.example not found. Creating empty .env file.")
            env_file.touch()
    
    # Initialize database
    print("\nStep 4: Initializing database")
    print("-" * 60)
    
    init_script = SCRIPT_DIR / "scripts" / "init_db.py"
    if not init_script.exists():
        print("Error: Database initialization script not found.")
        return
    
    print("Initializing database...")
    subprocess.run([str(venv_python), str(init_script)])
    
    # Done
    print("\nSetup completed successfully!")
    print("-" * 60)
    print("To run the server, use:")
    
    if os.name == 'nt':  # Windows
        print(f"venv\\Scripts\\python -m uvicorn app.main:app --reload")
    else:  # Unix/Linux/Mac
        print(f"venv/bin/python -m uvicorn app.main:app --reload")
    
    print("\nThe server will be available at http://localhost:8000")
    print("API documentation will be available at http://localhost:8000/api/docs")

if __name__ == "__main__":
    setup()
