import os
import cv2
import json
import time
import requests
import logging
from typing import List
import numpy as np

from src.core.ports import EmbeddingModel

logger = logging.getLogger(__name__)

class HuggingFaceAPI_CLIP(EmbeddingModel):
    """
    HuggingFace Inference API implementation of the CLIP embedding model.
    Bypasses PyTorch entirely to reduce memory footprint to basically 0MB,
    allowing inference on resource-constrained cloud environments like Render Free Tier.
    """
    
    def __init__(self):
        logger.info("Initializing HuggingFace API CLIP adapter (clip-vit-base-patch32)...")
        self.api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/openai/clip-vit-base-patch32"
        # Optional: Use HF_TOKEN if available to avoid rate limits
        self.token = os.environ.get("HF_TOKEN")
        
    def _call_api(self, data, is_json=False):
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
            
        if is_json:
            headers["Content-Type"] = "application/json"
        else:
            headers["Content-Type"] = "image/jpeg"
            
        for retry in range(12):
            try:
                if is_json:
                    response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
                else:
                    response = requests.post(self.api_url, headers=headers, data=data, timeout=30)
                    
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 503:
                    logger.info("HF API Model loading, waiting 15s...")
                    time.sleep(15)
                elif response.status_code == 429:
                    wait_time = min(60, (2 ** retry))
                    logger.warning(f"HF API Rate limited, waiting {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"HF API Error {response.status_code}: {response.text}")
                    time.sleep(5)
            except Exception as e:
                logger.error(f"HF API Request failed: {e}")
                time.sleep(5)
                
        logger.error("HF API failed after maximum retries.")
        return [0.0] * 512 # Fallback zero vector to prevent crashes

    def get_image_embeddings(self, images: List[np.ndarray]) -> List[List[float]]:
        if not images:
            return []
            
        embeddings = []
        for img in images:
            # Encode frame to JPEG
            success, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if not success:
                logger.error("Failed to encode image to JPEG")
                embeddings.append([0.0] * 512)
                continue
                
            image_bytes = buffer.tobytes()
            
            # Call HF API
            emb = self._call_api(image_bytes, is_json=False)
            
            # The HF API returns a list of floats (the embedding)
            # Sometimes it might return nested lists depending on the exact pipeline, so handle it:
            if isinstance(emb, list):
                if len(emb) > 0 and isinstance(emb[0], list):
                    emb = emb[0]
                    
            # Normalize
            try:
                emb_array = np.array(emb, dtype=np.float32)
                norm = np.linalg.norm(emb_array)
                if norm > 0:
                    emb_array = emb_array / norm
                embeddings.append(emb_array.tolist())
            except Exception as e:
                logger.error(f"Failed to process embedding: {e}")
                embeddings.append([0.0] * 512)
                
        return embeddings
        
    def get_text_embedding(self, text: str) -> List[float]:
        data = {"inputs": text}
        emb = self._call_api(data, is_json=True)
        
        if isinstance(emb, list):
            if len(emb) > 0 and isinstance(emb[0], list):
                emb = emb[0]
                
        try:
            emb_array = np.array(emb, dtype=np.float32)
            norm = np.linalg.norm(emb_array)
            if norm > 0:
                emb_array = emb_array / norm
            return emb_array.tolist()
        except Exception as e:
            logger.error(f"Failed to process text embedding: {e}")
            return [0.0] * 512
