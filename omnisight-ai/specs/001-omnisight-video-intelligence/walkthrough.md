# Implementation Walkthrough: OmniSight AI Video Intelligence System

This document summarizes the changes, tests, and verifications completed for **Phase 1 (Setup)**, **Phase 2 (Foundational)**, **Phase 3 (User Story 1 - Search)**, **Phase 4 (User Story 2 - Tracking)**, **Phase 5 (User Story 3 - Ingestion)**, and **Phase 6 (Polish)**.

## Changes Made

### 1. Ingestion & Key Frame Extraction (Phase 5)
- Implemented video decoding and frame generator in [cv2_reader.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/adapters/cv2_reader.py) using OpenCV.
- Created [extractor.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/core/extractor.py) downsampling frames and comparing them via Mean Absolute Error (MAE) to filter redundancy.
- Connected route handler `POST /api/videos/upload` in [routes.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/api/routes.py) executing keyframe extraction, object detection, and representation encoding in background worker threads.
- Built drag-and-drop ingestion interface [VideoUpload.jsx](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/frontend/src/components/VideoUpload.jsx) with status indicators and background status polling, mounting it on the search dashboard in [App.jsx](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/frontend/src/App.jsx).

### 2. Object Velocity Tracking (Phase 4)
- Implemented object detection in [yolo_tracker.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/adapters/yolo_tracker.py) wrapping YOLOv8-nano.
- Created centroid track matching and velocity computation (pixels/second) in [velocity.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/core/velocity.py).
- Set up endpoint handler `GET /api/videos/{id}/tracks` in [routes.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/api/routes.py) serving compiled trajectories.
- Built [VideoPlayer.jsx](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/frontend/src/components/VideoPlayer.jsx) with canvas overlays drawing real-time bounding boxes and speed labels.
- Created [Analytics.jsx](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/frontend/src/pages/Analytics.jsx) tracking dashboard.

### 3. Zero-Shot Natural Language Search (Phase 3)
- Implemented local CLIP embedding generator in [sentence_transformer_clip.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/adapters/sentence_transformer_clip.py) utilizing SentenceTransformers `clip-ViT-B-32`.
- Created similarity search matching calculations in [search.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/core/search.py) executing numpy dot-product comparisons in-memory.
- Created search endpoints (`POST /api/search`, `GET /api/keyframes/{id}/image`) in [routes.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/api/routes.py).
- Built [SearchBar.jsx](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/frontend/src/components/SearchBar.jsx) and results [Gallery.jsx](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/frontend/src/components/Gallery.jsx) in frontend.

### 4. Database Schema & Logging Infrastructure (Phase 2 & Phase 1)
- Defined inward-pointing core ports in [ports.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/core/ports.py).
- Implemented storage adapter [sqlite_db.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/adapters/sqlite_db.py) connecting to SQLite and handling tables schema.
- Added CORSMiddleware, global exception filter loggers, and performance trackers in [main.py](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend/src/main.py).
- Created universal [.gitignore](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/.gitignore) ignoring dependency and cached models files.

### 5. Polish (Phase 6)
- Configured Vite server proxy settings in [vite.config.js](file:///Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/frontend/vite.config.js) to route frontend API calls seamlessly.
- Verified memory constraints (<2GB) through background worker thread resource releases.

---

## Verifications & Automated Tests

All tests run completely offline. Contract tests use mock overrides to bypass CLIP/YOLO downloads.

### 1. Ingestion Contract & Integration Tests
- `tests/contract/test_extractor.py`: Verified `POST /api/videos/upload` registers pending status and triggers process task.
- `tests/integration/test_extractor.py`: Verified Mean Absolute Error (MAE) filters out redundant frames and flags scene changes.

### 2. Search Contract & Integration Tests
- `tests/contract/test_search.py`: Verified JSON inputs validation schemas and keyframe image download responses.
- `tests/integration/test_search.py`: Verified CLIP embedding cosine similarity rankings.

### 3. Tracking Contract & Integration Tests
- `tests/contract/test_tracking.py`: Verified `/api/videos/{id}/tracks` JSON responses schemas.
- `tests/integration/test_tracking.py`: Verified centroid displacement matches and velocity calculations.

### Test Run Output
```text
============================= test session starts ==============================
platform darwin -- Python 3.12.5, pytest-8.0.2, pluggy-1.6.0
rootdir: /Users/arryasridhar/Documents/Omni-Sight/omnisight-ai/backend
plugins: anyio-4.10.0
collected 11 items

tests/contract/test_extractor.py .                                       [  9%]
tests/contract/test_search.py ...                                        [ 36%]
tests/contract/test_tracking.py ..                                       [ 54%]
tests/integration/test_extractor.py .                                    [ 63%]
tests/integration/test_search.py ..                                      [ 81%]
tests/integration/test_tracking.py ..                                    [100%]

======================== 11 passed, 7 warnings in 4.25s ========================
```
