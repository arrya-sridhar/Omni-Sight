import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.api.routes import get_model, get_db
from src.core.ports import EmbeddingModel, Database

client = TestClient(app)

class MockEmbeddingModel(EmbeddingModel):
    def get_image_embeddings(self, images):
        return [[0.0] * 512 for _ in images]
    def get_text_embedding(self, text):
        return [0.0] * 512

class MockDatabase(Database):
    db_path = "data/mock.db"
    def save_video(self, video): pass
    def get_video(self, video_id): return None
    def list_videos(self): return []
    def save_keyframe(self, keyframe): pass
    def get_keyframes(self, video_id): return []
    def get_all_keyframes(self): return []
    def get_keyframe(self, keyframe_id): return None
    def save_tracked_objects(self, tracked_objects): pass
    def get_tracked_objects(self, video_id): return []

# Override dependencies for testing
app.dependency_overrides[get_model] = lambda: MockEmbeddingModel()
app.dependency_overrides[get_db] = lambda: MockDatabase()

def test_search_endpoint_schema_validation():
    # Invalid JSON schema should fail (422)
    response = client.post("/api/search", json={"invalid": "payload"})
    assert response.status_code == 422

def test_search_endpoint_success_empty_results():
    payload = {
        "query": "test query",
        "video_ids": [],
        "threshold": 0.1,
        "limit": 5
    }
    response = client.post("/api/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "query" in data
    assert "results" in data
    assert isinstance(data["results"], list)

def test_keyframe_image_not_found():
    response = client.get("/api/keyframes/non-existent-uuid/image")
    assert response.status_code == 404
