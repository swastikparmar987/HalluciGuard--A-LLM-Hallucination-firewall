import requests
import os
from dotenv import load_dotenv

load_dotenv()
keys = os.getenv("GEMINI_API_KEYS", "").split(",")
key = keys[0].strip()

models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"]

for m in models:
    url = f"https://generativelanguage.googleapis.com/v1/models/{m}:generateContent?key={key}"
    try:
        res = requests.post(url, json={"contents": [{"parts": [{"text": "hi"}]}]}, timeout=5)
        print(f"Model {m}: {res.status_code}")
        if res.status_code == 200:
            print(f"FOUND WORKING MODEL: {m}")
            break
    except:
        print(f"Model {m}: Failed")
