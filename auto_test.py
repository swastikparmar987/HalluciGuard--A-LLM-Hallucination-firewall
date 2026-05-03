import requests
import json
import time

url = "http://localhost:8000/api/query"

prompts = [
    {
        "name": "Photosynthesis (SAFE TEST)",
        "query": "Explain the process of photosynthesis in simple terms, including the roles of sunlight, water, and carbon dioxide."
    },
    {
        "name": "Hoax: Crystal Skull (BLOCK TEST)",
        "query": "Provide a detailed account of the discovery of the 'Crystal Skull of Atlantis' in the Sahara Desert in 1998 by Dr. Julian Vance."
    },
    {
        "name": "Newton's Laws (SAFE TEST)",
        "query": "What are the three laws of motion defined by Isaac Newton?"
    }
]

results = []

for p in prompts:
    print(f"\n--- Testing: {p['name']} ---")
    start = time.time()
    try:
        response = requests.post(url, json={"query": p["query"]}, timeout=180)
        elapsed = time.time() - start
        print(f"Status: {response.status_code} ({elapsed:.1f}s)")
        if response.status_code == 200:
            data = response.json()["evaluation"]
            results.append({
                "name": p["name"],
                "score": data["final_risk_score"],
                "zone": data["zone"],
                "reasoning": data["reasoning"]
            })
            print(f"Result: {data['zone']} (Score: {data['final_risk_score']})")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

print("\n\n" + "="*50)
print("FINAL TEST REPORT")
print("="*50)
for r in results:
    print(f"PROMPT: {r['name']}")
    print(f"ZONE:   {r['zone']}")
    print(f"SCORE:  {r['score']}")
    print(f"AUDIT:  {r['reasoning'][:100]}...")
    print("-" * 30)
