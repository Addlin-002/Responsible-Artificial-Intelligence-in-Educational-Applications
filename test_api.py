
import requests
import json

url = "http://127.0.0.1:5000/api/audit/analyze"

payload = {
    "text": "All students deserve equal opportunities to learn. Teachers should encourage critical thinking and independent learning.",
    "content_type": "Educational paragraph",
    "education_level": "Undergraduate",
    "subject": "Education"
}

response = requests.post(url, json=payload)

print("HTTP Status:", response.status_code)
print(json.dumps(response.json(), indent=4))
