import pytest
import numpy as np
from src.core.velocity import CentroidTracker, VelocityCalculator

def test_centroid_tracking_and_velocity():
    tracker = CentroidTracker(max_disappeared=5)
    
    # Bounding boxes format: [x, y, w, h]
    # Frame 1 (t=0.0): Object is at [100, 100, 50, 50] (Center: 125, 125)
    detections_f1 = [
        {"bbox": [100, 100, 50, 50], "label": "car", "confidence": 0.9}
    ]
    tracks_f1 = tracker.update(detections_f1, frame_index=1, timestamp=0.0)
    
    assert len(tracks_f1) == 1
    assert tracks_f1[0]["track_id"] == 1
    assert tracks_f1[0]["bbox"] == [100, 100, 50, 50]
    
    # Frame 2 (t=0.1): Object has moved to [110, 110, 50, 50] (Center: 135, 135)
    # Displacement = sqrt((135-125)^2 + (135-125)^2) = sqrt(200) = 14.142 pixels
    # dt = 0.1s. Velocity = 14.142 / 0.1 = 141.42 pixels/sec
    detections_f2 = [
        {"bbox": [110, 110, 50, 50], "label": "car", "confidence": 0.9}
    ]
    tracks_f2 = tracker.update(detections_f2, frame_index=2, timestamp=0.1)
    
    assert len(tracks_f2) == 1
    assert tracks_f2[0]["track_id"] == 1
    assert tracks_f2[0]["velocity"] is not None
    assert abs(tracks_f2[0]["velocity"] - 141.42) < 0.1

def test_centroid_tracker_disappearance():
    tracker = CentroidTracker(max_disappeared=2)
    
    # Frame 1: Register
    tracker.update([{"bbox": [100, 100, 50, 50], "label": "person", "confidence": 0.8}], 1, 0.0)
    assert len(tracker.objects) == 1
    
    # Frame 2: Missing (disappeared=1)
    tracker.update([], 2, 0.1)
    assert len(tracker.objects) == 1
    
    # Frame 3: Missing (disappeared=2)
    tracker.update([], 3, 0.2)
    assert len(tracker.objects) == 1
    
    # Frame 4: Deregistered (disappeared=3 > max)
    tracker.update([], 4, 0.3)
    assert len(tracker.objects) == 0
