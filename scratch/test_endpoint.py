import requests

def test_benchmark():
    try:
        print("Testing /api/benchmark...")
        resp = requests.post("http://127.0.0.1:8000/api/benchmark", timeout=5)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_benchmark()
