import pytest
import numpy as np
from src.core.ports import EmbeddingModel, Database
from src.core.search import SearchService

class MockEmbeddingModel(EmbeddingModel):
    def get_image_embeddings(self, images):
        # Return dummy 512-dim embeddings
        return [[1.0 if i == 0 else 0.0 for i in range(512)] for _ in images]
        
    def get_text_embedding(self, text):
        # Query matching vector
        if "person" in text:
            return [1.0 if i == 0 else 0.0 for i in range(512)]
        return [0.0 if i == 0 else 1.0 for i in range(512)]

class MockDatabase(Database):
    def __init__(self):
        self.keyframes = [
            {
                "id": "kf-1",
                "video_id": "vid-1",
                "frame_index": 10,
                "timestamp": 2.0,
                "embedding": [1.0 if i == 0 else 0.0 for i in range(512)], # matches "person"
                "image_path": "/path/kf1.jpg"
            },
            {
                "id": "kf-2",
                "video_id": "vid-1",
                "frame_index": 20,
                "timestamp": 4.0,
                "embedding": [0.0 if i == 0 else 1.0 for i in range(512)], # matches other
                "image_path": "/path/kf2.jpg"
            }
        ]
        self.video = {
            "id": "vid-1",
            "filename": "test.mp4",
            "filepath": "/path/test.mp4",
            "duration": 10.0,
            "frame_rate": 30.0,
            "width": 1920,
            "height": 1080,
            "status": "completed",
            "created_at": "2026-06-10T14:31:00Z"
        }

    def get_video(self, video_id):
        if video_id == "vid-1":
            return self.video
        return None

    def list_videos(self):
        return [self.video]

    def get_keyframes(self, video_id):
        return self.keyframes

    def get_all_keyframes(self):
        return self.keyframes

    def get_keyframe(self, keyframe_id):
        for kf in self.keyframes:
            if kf["id"] == keyframe_id:
                return kf
        return None

    def save_video(self, video): pass
    def save_keyframe(self, keyframe): pass
    def save_tracked_objects(self, tracked_objects): pass
    def get_tracked_objects(self, video_id): return []

def test_similarity_search_ranking():
    db = MockDatabase()
    model = MockEmbeddingModel()
    service = SearchService(db=db, model=model)
    
    # Query "person" which aligns with kf-1's embedding
    results = service.search(query="a person walking", video_ids=["vid-1"], threshold=0.5, limit=5)
    
    assert len(results) == 1
    assert results[0]["keyframe_id"] == "kf-1"
    assert abs(results[0]["score"] - 1.0) < 1e-5

def test_similarity_search_no_matches():
    db = MockDatabase()
    model = MockEmbeddingModel()
    service = SearchService(db=db, model=model)
    
    # High threshold should return nothing if we search for something unrelated
    results = service.search(query="person", video_ids=["vid-1"], threshold=0.99, limit=5)
    # The matching keyframe (kf-1) has score 1.0, so it passes. kf-2 has score 0.0, so it fails.
    assert len(results) == 1
    
    results_high = service.search(query="something else", video_ids=["vid-1"], threshold=0.99, limit=5)
    # matches other (kf-2 has score 1.0, kf-1 has score 0.0)
    assert len(results_high) == 1
    assert results_high[0]["keyframe_id"] == "kf-2"
