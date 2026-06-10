from abc import ABC, abstractmethod
from typing import Generator, List, Dict, Any, Optional
import numpy as np

class VideoReader(ABC):
    """Port for video decoding and metadata extraction."""
    
    @abstractmethod
    def get_metadata(self, filepath: str) -> Dict[str, Any]:
        """Extract duration, frame rate, width, and height of a video."""
        pass
        
    @abstractmethod
    def read_frames(self, filepath: str) -> Generator[tuple[int, float, np.ndarray], None, None]:
        """
        Yields (frame_index, timestamp_seconds, frame_image) sequentially.
        Frames are represented as standard NumPy arrays (BGR layout).
        """
        pass

class EmbeddingModel(ABC):
    """Port for multi-modal representation encoding (e.g. CLIP)."""
    
    @abstractmethod
    def get_image_embeddings(self, images: List[np.ndarray]) -> List[List[float]]:
        """Generate high-dimensional embeddings for a batch of images."""
        pass
        
    @abstractmethod
    def get_text_embedding(self, text: str) -> List[float]:
        """Generate high-dimensional embedding for a text query."""
        pass

class ObjectTracker(ABC):
    """Port for detecting and tracking objects across consecutive video frames."""
    
    @abstractmethod
    def track_frame(
        self, 
        frame: np.ndarray, 
        frame_index: int, 
        timestamp: float
    ) -> List[Dict[str, Any]]:
        """
        Detect and track objects in a single frame.
        Returns a list of dicts with keys:
          - "track_id": int
          - "label": str
          - "bbox": list[float] (x, y, w, h)
          - "confidence": float
        """
        pass
        
    @abstractmethod
    def reset(self) -> None:
        """Reset internal tracking states (e.g. at the start of a new video)."""
        pass

class Database(ABC):
    """Port for local metadata storage and persistence."""
    
    @abstractmethod
    def save_video(self, video: Dict[str, Any]) -> None:
        """Create or update a video record."""
        pass
        
    @abstractmethod
    def get_video(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve video details."""
        pass
        
    @abstractmethod
    def list_videos(self) -> List[Dict[str, Any]]:
        """Retrieve all video records."""
        pass
        
    @abstractmethod
    def save_keyframe(self, keyframe: Dict[str, Any]) -> None:
        """Persist an extracted keyframe and its vector embedding."""
        pass
        
    @abstractmethod
    def get_keyframes(self, video_id: str) -> List[Dict[str, Any]]:
        """Retrieve all keyframes for a specific video."""
        pass
        
    @abstractmethod
    def get_all_keyframes(self) -> List[Dict[str, Any]]:
        """Retrieve all keyframes in the database for cross-video search."""
        pass
        
    @abstractmethod
    def get_keyframe(self, keyframe_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single keyframe by its ID."""
        pass
        
    @abstractmethod
    def save_tracked_objects(self, tracked_objects: List[Dict[str, Any]]) -> None:
        """Persist tracked object metadata and trajectories."""
        pass
        
        
    @abstractmethod
    def get_tracked_objects(self, video_id: str) -> List[Dict[str, Any]]:
        """Retrieve all tracked objects and their trajectories for a video."""
        pass
