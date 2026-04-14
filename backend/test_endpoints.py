import requests

BASE_URL = "http://localhost:8000"

def test_ping():
    print("Testing /api/ping...")
    res = requests.get(f"{BASE_URL}/api/ping")
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
    print()

def test_health():
    print("Testing /api/health...")
    res = requests.get(f"{BASE_URL}/api/health")
    print(f"Status: {res.status_code}")
    try:
        print(f"Keys: {list(res.json().keys())}")
    except:
        print(f"Failed to parse json: {res.text}")
    print()

def test_scan():
    print("Testing /api/scan...")
    payload = {
        "user_input": "A React Native and Django project",
        "detected_tools": ["node", "python3"]
    }
    res = requests.post(f"{BASE_URL}/api/scan", json=payload)
    print(f"Status: {res.status_code}")
    try:
        data = res.json()
        print(f"Stack Name: {data.get('stack_name')}")
        print(f"Overall Score: {data.get('overall_score')}")
        print("AI Analysis snippet:", str(data.get("ai_analysis"))[:200])
    except:
        print(f"Response: {res.text}")
    print()

def test_analyze(is_github=False):
    if not is_github:
        print("Testing /api/analyze...")
        payload = {
            "project_description": "We are building an AI app using FastAPI and React"
        }
        res = requests.post(f"{BASE_URL}/api/analyze", json=payload)
        print(f"Status: {res.status_code}")
        try:
            print("AI summary length:", len(res.json().get("ai_analysis", {}).get("health_summary", "")))
        except:
            print(f"Response: {res.text}")
    else:
        print("Testing /api/analyze-github...")
        payload = {
            "repo_url": "https://github.com/fastapi/fastapi"
        }
        res = requests.post(f"{BASE_URL}/api/analyze-github", json=payload)
        print(f"Status: {res.status_code}")
        try:
            print(f"Github API Response keys: {list(res.json().keys())}")
        except:
            print(f"Response: {res.text}")
    print()

if __name__ == "__main__":
    test_ping()
    test_health()
    test_scan()
    test_analyze()
    test_analyze(is_github=True)
