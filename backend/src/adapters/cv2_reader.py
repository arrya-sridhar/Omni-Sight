import cv2
import os
from typing import Dict, Any, Generator, Tuple
import numpy as np
from src.core.ports import VideoReader

class CV2VideoReader(VideoReader):
    """OpenCV implementation of the VideoReader port."""
    
    def get_metadata(self, filepath: str) -> Dict[str, Any]:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Video file not found at {filepath}")
            
        cap = cv2.VideoCapture(filepath)
        if not cap.isOpened():
            raise ValueError(f"OpenCV could not open video file: {filepath}")
            
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        duration = float(frame_count / fps) if fps > 0 else 0.0
        cap.release()
        
        return {
            "duration": duration,
            "frame_rate": fps,
            "width": width,
            "height": height
        }
        
    def read_frames(self, filepath: str) -> Generator[Tuple[int, float, np.ndarray], None, None]:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Video file not found at {filepath}")
            
        cap = cv2.VideoCapture(filepath)
        if not cap.isOpened():
            raise ValueError(f"OpenCV could not open video file: {filepath}")
            
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        frame_index = 0
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret or frame is None:
                    break
                
                # Compute timestamp based on frame index and FPS
                timestamp = float(frame_index / fps) if fps > 0 else 0.0
                yield frame_index, timestamp, frame
                frame_index += 1
        finally:
            cap.release()
