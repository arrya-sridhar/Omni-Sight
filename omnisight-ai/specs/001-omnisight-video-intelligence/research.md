# Research Notes: OmniSight AI Multi-Modal Video Intelligence

This document records the design decisions, rationales, and alternatives considered during Phase 0 research.

## 1. Video Ingestion & Key Frame Extraction

- **Decision**: Use OpenCV (`opencv-python`) for video decoding, combined with an average hash (aHash) or histogram-based frame difference algorithm for lightweight keyframe extraction.
- **Rationale**: OpenCV is the industry standard for video manipulation, offers robust decoding performance, and has pre-compiled binaries for Mac/Linux/Windows. Using average hashing or frame histogram differences is CPU-lightweight, fast, and does not require neural model inference for the filtering step, matching our latency constraints.
- **Alternatives Considered**:
  - *PyAV (FFmpeg bindings)*: Provides direct access to FFmpeg codecs but is more complex to configure and lacks built-in image processing utilities.
  - *Decord*: Highly optimized video reader, but lacks broad pre-compiled wheel support and is prone to platform-specific installation failures.

---

## 2. Object Detection & Velocity Tracking

- **Decision**: Use Ultralytics YOLOv8-nano for local object detection, paired with a custom lightweight Centroid Tracker.
- **Rationale**: YOLOv8-nano is a state-of-the-art detector with a tiny memory footprint (~6MB parameters) that runs in <20ms on modern local hardware. Centroid tracking provides simple, fast, and low-overhead tracking by matching bounding box centers across frames, which is perfect for relative pixel-based velocity calculations.
- **Alternatives Considered**:
  - *DeepSORT / ByteTrack*: Highly accurate multi-object tracking but requires deep learning appearance descriptors or complex kalman filtering, which increases resource usage and violates YAGNI.
  - *OpenCV built-in trackers (CSRT/KCF)*: Slow and prone to drift when multiple objects cross paths.

---

## 3. Multi-Modal Representation Encoding

- **Decision**: Use the SentenceTransformers library running the `clip-ViT-B-32` model locally for zero-shot text-to-image encoding.
- **Rationale**: CLIP ViT-B-32 maps both text queries and visual keyframes to the same 512-dimensional vector space. Running this locally via PyTorch/SentenceTransformers provides zero-shot natural language search (e.g. searching for "person walking dog" without explicit class training) with highly optimized CPU/GPU execution.
- **Alternatives Considered**:
  - *Raw Hugging Face Transformers CLIP*: Works well but has a more verbose API and is less optimized for similarity search tasks than SentenceTransformers.
  - *Cloud APIs (OpenAI/Gemini)*: Violated the local-first data privacy principle of the OmniSight AI Constitution.

---

## 4. Vector and Metadata Storage

- **Decision**: Use SQLite for storing structured metadata (videos, keyframes, tracked objects) and serialize embeddings as binary BLOBs. Cosine similarity queries will be executed in memory using NumPy.
- **Rationale**: Given that keyframe extraction reduces frames by >=75%, a 1-hour video yields ~1,800 keyframes. Vector search against 1,800 512-dimensional vectors takes <10ms in NumPy, completely eliminating the need for a dedicated vector database server. This fits the YAGNI principle perfectly, requires zero external services, and is fully local-first.
- **Alternatives Considered**:
  - *Dedicated Vector Database (Qdrant / Milvus)*: Requires running a separate daemon or Docker container, which increases setup complexity and goes against the sandboxed verification principles.
  - *SQLite-vec Extension*: Excellent lightweight C extension for SQLite, but adds native compilation dependencies. We will stick to NumPy-based flat memory scanning for the MVP and design the storage adapter to easily swap in sqlite-vec if scaled.
