import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_video_upload_endpoint_success():
    # Submit a dummy file to the upload endpoint
    files = {"file": ("test.mp4", b"dummy video content", "video/mp4")}
    response = client.post("/api/videos/upload", files=files)
    
    # Check status code is 202 Accepted or maps correctly
    assert response.status_code == 202
    data = response.json()
    assert "id" in data
    assert "filename" in data
    assert data["filename"] == "test.mp4"
    assert "status" in data
