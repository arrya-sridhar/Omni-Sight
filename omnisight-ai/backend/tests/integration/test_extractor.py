import pytest
import numpy as np
from src.core.extractor import KeyFrameExtractor

def test_keyframe_extraction_similarity_filter():
    # We will simulate a video frame stream
    # Frame 1: Solid black frame
    frame_black_1 = np.zeros((100, 100, 3), dtype=np.uint8)
    # Frame 2: Same black frame (should be marked as redundant)
    frame_black_2 = np.zeros((100, 100, 3), dtype=np.uint8)
    # Frame 3: Solid white frame (scene change, should be marked as keyframe)
    frame_white = np.ones((100, 100, 3), dtype=np.uint8) * 255
    
    extractor = KeyFrameExtractor(threshold=10.0) # difference threshold
    
    # Process Frame 1 (first frame is always a keyframe)
    is_kf_1, diff_1 = extractor.process_frame(frame_black_1, frame_index=0, timestamp=0.0)
    assert is_kf_1 is True
    
    # Process Frame 2 (identical to Frame 1, should be filtered)
    is_kf_2, diff_2 = extractor.process_frame(frame_black_2, frame_index=1, timestamp=0.1)
    assert is_kf_2 is False
    assert diff_2 == 0.0
    
    # Process Frame 3 (completely different, should be a keyframe)
    is_kf_3, diff_3 = extractor.process_frame(frame_white, frame_index=2, timestamp=0.2)
    assert is_kf_3 is True
    assert diff_3 > 10.0
