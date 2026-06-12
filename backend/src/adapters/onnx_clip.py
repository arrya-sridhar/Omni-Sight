import numpy as np
import cv2
from typing import List
import onnxruntime as ort
from huggingface_hub import hf_hub_download
from tokenizers import Tokenizer
import logging

from src.core.ports import EmbeddingModel

logger = logging.getLogger(__name__)

class ONNXCLIP(EmbeddingModel):
    """
    ONNX implementation of the CLIP embedding model.
    Bypasses PyTorch entirely to reduce memory footprint from ~800MB to ~150MB,
    allowing inference on resource-constrained cloud environments like Render Free Tier.
    """
    
    def __init__(self, repo_id: str = "Xenova/clip-vit-base-patch32"):
        logger.info(f"Initializing ONNX CLIP model from {repo_id}...")
        
        # Download models and tokenizer
        self.vision_model_path = hf_hub_download(repo_id=repo_id, filename="onnx/vision_model.onnx")
        self.text_model_path = hf_hub_download(repo_id=repo_id, filename="onnx/text_model.onnx")
        self.tokenizer_path = hf_hub_download(repo_id=repo_id, filename="tokenizer.json")
        
        # Initialize ONNX sessions
        # Using CPUExecutionProvider as default for cloud servers without GPUs
        options = ort.SessionOptions()
        options.inter_op_num_threads = 1
        options.intra_op_num_threads = 1
        self.vision_session = ort.InferenceSession(self.vision_model_path, options, providers=['CPUExecutionProvider'])
        self.text_session = ort.InferenceSession(self.text_model_path, options, providers=['CPUExecutionProvider'])
        
        # Initialize Tokenizer
        self.tokenizer = Tokenizer.from_file(self.tokenizer_path)
        self.tokenizer.enable_truncation(max_length=77)
        self.tokenizer.enable_padding(length=77, pad_token="<|endoftext|>")
        
        # Pre-allocate vision processing constants
        self.mean = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
        self.std = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)

    def _preprocess_image(self, img: np.ndarray) -> np.ndarray:
        """Preprocess OpenCV BGR image to CLIP ONNX input format."""
        # Convert BGR to RGB
        if img.shape[-1] == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
        # Resize shortest edge to 224
        h, w = img.shape[:2]
        if h < w:
            new_h, new_w = 224, int(w * 224 / h)
        else:
            new_h, new_w = int(h * 224 / w), 224
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        
        # Center crop to 224x224
        start_y = (new_h - 224) // 2
        start_x = (new_w - 224) // 2
        img = img[start_y:start_y+224, start_x:start_x+224]
        
        # Normalize
        img = img.astype(np.float32) / 255.0
        img = (img - self.mean) / self.std
        
        # HWC to CHW
        img = np.transpose(img, (2, 0, 1))
        return img

    def get_image_embeddings(self, images: List[np.ndarray]) -> List[List[float]]:
        if not images:
            return []
            
        embeddings = []
        for img in images:
            processed_img = self._preprocess_image(img)
            # Add batch dimension
            batch_img = np.expand_dims(processed_img, axis=0)
            
            # Run vision model
            inputs = {self.vision_session.get_inputs()[0].name: batch_img}
            outputs = self.vision_session.run(None, inputs)
            
            # First output is the pooled embedding
            emb = outputs[0][0]
            
            # L2 normalize just to be safe, though CLIP ONNX usually returns normalized
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm
                
            embeddings.append(emb.tolist())
            
        return embeddings
        
    def get_text_embedding(self, text: str) -> List[float]:
        encoded = self.tokenizer.encode(text)
        
        # CLIP text model requires int64
        input_ids = np.array([encoded.ids], dtype=np.int64)
        
        inputs = {
            "input_ids": input_ids
        }
        outputs = self.text_session.run(None, inputs)
        
        emb = outputs[0][0]
        
        # L2 normalize
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
            
        return emb.tolist()
