import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.api.routes import get_db
from src.core.ports import Database

client = TestClient(app)

class MockDatabase(Database):
    db_path = "data/mock.db"
    def get_tracked_objects(self, video_id):
        if video_id == "vid-1":
            return [
                {
                    "id": "obj-1",
                    "video_id": "vid-1",
                    "track_id": 1,
                    "label": "car",
                    "start_timestamp": 1.0,
                    "end_timestamp": 3.0,
                    "avg_velocity": 120.5,
                    "peak_velocity": 150.2,
                    "trajectory_json": '[]'
                }
            ]
        return []

    def get_video(self, video_id): return None
    def list_videos(self): return []
    def save_video(self, video): pass
    def save_keyframe(self, keyframe): pass
    def get_keyframes(self, video_id): return []
    def get_all_keyframes(self): return []
    def get_keyframe(self, keyframe_id): return None
    def save_tracked_objects(self, tracked_objects): pass

app.dependency_overrides[get_db] = lambda: MockDatabase()

def test_get_tracks_success():
    response = client.get("/api/videos/vid-1/tracks")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["track_id"] == 1
    assert data[0]["label"] == "car"
    assert data[0]["avg_velocity"] == 120.5

def test_get_tracks_empty():
    response = client.get("/api/videos/non-existent-video/tracks")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0
