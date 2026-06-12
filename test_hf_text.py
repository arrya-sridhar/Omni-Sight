import requests
api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/openai/clip-vit-base-patch32"
data = {"inputs": "a photo of a cat"}
print("Sending text request to HF API...")
response = requests.post(api_url, json=data)
if response.status_code == 200:
    res = response.json()
    if isinstance(res, list) and len(res) > 0:
        print(f"Success! Length: {len(res[0]) if isinstance(res[0], list) else len(res)}")
else:
    print(f"Error {response.status_code}: {response.text}")
