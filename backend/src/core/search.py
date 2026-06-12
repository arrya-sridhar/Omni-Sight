import numpy as np
from typing import List, Dict, Any
from src.core.ports import Database, EmbeddingModel

class SearchService:
    """Core domain service for performing zero-shot multi-modal searches."""
    
    def __init__(self, db: Database, model: EmbeddingModel):
        self.db = db
        self.model = model
        
    def search(
        self, 
        query: str, 
        video_ids: List[str] = None, 
        threshold: float = 0.2, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        if not query:
            return []
            
        # Get query text embedding
        query_vector = np.array(self.model.get_text_embedding(query), dtype=np.float32)
        return self.search_by_vector(query_vector, video_ids, threshold, limit)
        
    def search_by_vector(
        self,
        query_vector: np.ndarray,
        video_ids: List[str] = None,
        threshold: float = 0.2,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        import logging
        logger = logging.getLogger("search")
        logger.info(f"search_by_vector called. Threshold: {threshold}, limit: {limit}")
        
        norm_query = np.linalg.norm(query_vector)
        logger.debug(f"Query vector norm: {norm_query}")
        
        # Load candidate keyframes from DB
        keyframes = []
        if video_ids:
            for vid_id in video_ids:
                keyframes.extend(self.db.get_keyframes(vid_id))
        else:
            keyframes = self.db.get_all_keyframes()
            
        logger.info(f"Loaded {len(keyframes)} keyframes from database for search.")
            
        results = []
        for kf in keyframes:
            kf_vector = np.array(kf["embedding"], dtype=np.float32)
            norm_kf = np.linalg.norm(kf_vector)
            
            if norm_query == 0 or norm_kf == 0:
                score = 0.0
            else:
                score = float(np.dot(query_vector, kf_vector) / (norm_query * norm_kf))
                
            if score >= threshold:
                video = self.db.get_video(kf["video_id"])
                filename = video["filename"] if video else "unknown"
                
                results.append({
                    "video_id": kf["video_id"],
                    "filename": filename,
                    "keyframe_id": kf["id"],
                    "timestamp": kf["timestamp"],
                    "image_url": f"/api/keyframes/{kf['id']}/image",
                    "score": score
                })
                
        logger.info(f"Search yielded {len(results)} results above threshold {threshold}.")
        # Sort results descending by score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]
