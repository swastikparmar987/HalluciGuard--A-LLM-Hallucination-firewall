import requests
import json
import time

url = "http://localhost:8000/api/query"

prompts = [
    {
        "name": "Newton's Laws (SAFE TEST)",
        "query": "What are the three laws of motion defined by Isaac Newton?"
    }
]

for p in prompts:
    print(f"\n--- Testing: {p['name']} ---")
    # Added delay to recover from rate limits
    print("Waiting 30s to clear rate limits...")
    time.sleep(30)
    
    start = time.time()
    try:
        response = requests.post(url, json={"query": p["query"]}, timeout=180)
        elapsed = time.time() - start
        print(f"Status: {response.status_code} ({elapsed:.1f}s)")
        if response.status_code == 200:
            data = response.json()["evaluation"]
            print(f"Result: {data['zone']} (Score: {data['final_risk_score']})")
            print(f"Reasoning: {data['reasoning']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
