import requests
import os
from dotenv import load_dotenv

load_dotenv()
keys = os.getenv("GEMINI_API_KEYS", "").split(",")
key = keys[0].strip()

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
res = requests.get(url).json()

print("AVAILABLE MODELS THAT SUPPORT generateContent:")
for m in res.get('models', []):
    if 'generateContent' in m.get('supportedGenerationMethods', []):
        print(f" - {m['name']}")
