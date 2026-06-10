import cv2
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
from src.core.ports import EmbeddingModel

class SentenceTransformerCLIP(EmbeddingModel):
    """SentenceTransformers implementation of the EmbeddingModel port using CLIP."""
    
    def __init__(self, model_name: str = "clip-ViT-B-32"):
        # This will load the model from cache or download it on first init.
        # By default, it operates completely locally once cached.
        self.model = SentenceTransformer(model_name)
        
    def get_image_embeddings(self, images: List[np.ndarray]) -> List[List[float]]:
        if not images:
            return []
            
        # OpenCV reads in BGR, CLIP models expect RGB
        rgb_images = []
        for img in images:
            if img.shape[-1] == 3:
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            else:
                rgb_img = img
            rgb_images.append(rgb_img)
            
        embeddings = self.model.encode(rgb_images, show_progress_bar=False)
        # Convert numpy floats to standard Python float lists
        return [emb.tolist() for emb in embeddings]
        
    def get_text_embedding(self, text: str) -> List[float]:
        embedding = self.model.encode(text, show_progress_bar=False)
        return embedding.tolist()
