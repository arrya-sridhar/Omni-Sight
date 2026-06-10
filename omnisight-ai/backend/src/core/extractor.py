import cv2
import numpy as np
from typing import Tuple, Optional

class KeyFrameExtractor:
    """Core domain service for filtering visual redundancy and extracting key frames."""
    
    def __init__(self, threshold: float = 12.0):
        self.threshold = threshold
        self.last_keyframe_gray: Optional[np.ndarray] = None
        
    def process_frame(
        self, 
        frame: np.ndarray, 
        frame_index: int, 
        timestamp: float
    ) -> Tuple[bool, float]:
        """
        Evaluate if a frame qualifies as a keyframe.
        Returns:
          - (is_keyframe: bool, visual_difference_score: float)
        """
        # Convert BGR frame to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Downsample to a small standard size (32x32) to average out noise and focus on macro changes
        small_gray = cv2.resize(gray, (32, 32), interpolation=cv2.INTER_AREA)
        
        # If this is the first frame processed, it is always a keyframe
        if self.last_keyframe_gray is None:
            self.last_keyframe_gray = small_gray
            return True, 0.0
            
        # Calculate Mean Absolute Error (MAE) between current frame and the last keyframe
        diff = float(np.mean(np.abs(small_gray.astype(np.float32) - self.last_keyframe_gray.astype(np.float32))))
        
        if diff >= self.threshold:
            # Shift the reference frame to the current keyframe
            self.last_keyframe_gray = small_gray
            return True, diff
            
        return False, diff
        
    def reset(self) -> None:
        """Reset reference state (e.g. at the start of a new video ingestion)."""
        self.last_keyframe_gray = None
