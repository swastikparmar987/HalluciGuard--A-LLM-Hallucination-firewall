import requests
import json
import time

queries = [
    "What is the capital of France?",
    "Who invented the telephone and exact year?",
    "What is Einstein's exact IQ score?",
]

for q in queries:
    print(f"\n{'='*60}")
    print(f"Query: {q}")
    t = time.time()
    try:
        r = requests.post(
            'http://127.0.0.1:8000/api/query',
            json={'query': q},
            timeout=120
        )
        elapsed = time.time() - t
        print(f"Time: {elapsed:.1f}s | Status: {r.status_code}")

        if r.status_code == 200:
            d = r.json()
            ev = d.get("evaluation", {})
            print(f"Zone: {ev.get('zone')} | Score: {ev.get('final_risk_score')}")
            print(f"Signals: {json.dumps(ev.get('signals', {}))}")
        else:
            print(f"ERROR: {r.text[:200]}")
    except Exception as e:
        print(f"EXCEPTION: {e}")

print("\n\nAll tests passed!")
