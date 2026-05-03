import os
import sys

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set an environment variable to tell the app it's on Vercel
os.environ["IS_VERCEL"] = "true"

from backend.main import app
