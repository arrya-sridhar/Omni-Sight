import torch

# Monkeypatch torch.load to support loading YOLO models under PyTorch 2.6+
_original_load = torch.load
def _custom_load(*args, **kwargs):
    if "weights_only" not in kwargs:
        kwargs["weights_only"] = False
    return _original_load(*args, **kwargs)
torch.load = _custom_load

from ultralytics import YOLO
from typing import List, Dict, Any
import numpy as np
from src.core.ports import ObjectTracker
from src.core.velocity import CentroidTracker

class YOLOTracker(ObjectTracker):
    """YOLOv8 implementation of the ObjectTracker port using Centroid Tracker."""
    
    def __init__(self, model_name: str = "yolov8n.pt"):
        # This loads the YOLO model from local cache or downloads it on first init.
        self.model = YOLO(model_name)
        self.tracker = CentroidTracker()
        
    def track_frame(
        self, 
        frame: np.ndarray, 
        frame_index: int, 
        timestamp: float
    ) -> List[Dict[str, Any]]:
        # Run local YOLOv8-nano inference
        results = self.model(frame, verbose=False)[0]
        
        detections = []
        for box in results.boxes:
            xyxy = box.xyxy[0].tolist()
            x1, y1, x2, y2 = xyxy
            w = x2 - x1
            h = y2 - y1
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            label = self.model.names[cls_id]
            
            # Track standard objects of interest (vehicles, people)
            target_classes = {"person", "bicycle", "car", "motorcycle", "bus", "truck"}
            if label in target_classes:
                detections.append({
                    "bbox": [x1, y1, w, h],
                    "label": label,
                    "confidence": conf
                })
                
        # Match detections across frames and compute displacement velocities
        active_tracks = self.tracker.update(detections, frame_index, timestamp)
        return active_tracks
        
    def reset(self) -> None:
        self.tracker = CentroidTracker()
