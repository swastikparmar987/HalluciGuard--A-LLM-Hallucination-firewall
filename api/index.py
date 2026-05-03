import os
import sys
import subprocess

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure SpaCy model is downloaded (Vercel specific hack)
try:
    import spacy
    if not spacy.util.is_package("en_core_web_sm"):
        subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
except ImportError:
    pass

from backend.main import app
