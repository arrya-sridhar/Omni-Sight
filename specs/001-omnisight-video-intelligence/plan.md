# Implementation Plan: OmniSight AI Multi-Modal Video Intelligence System

**Branch**: `001-omnisight-video-intelligence` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-omnisight-video-intelligence/spec.md`

## Summary
The goal is to build a local-first, privacy-preserving video intelligence system named **OmniSight AI**. The backend core will be written in Python using FastAPI, leveraging OpenCV for video frame decoding, Ultralytics YOLOv8-nano for local object detection/tracking, and SentenceTransformers CLIP for zero-shot multi-modal vector search. The frontend UI will be built as a modern React application using Tailwind CSS. Structured metadata and vectors will be stored in an embedded SQLite database, with NumPy handles executing cosine similarity in-memory.

## Technical Context

**Language/Version**: Python 3.11+, JavaScript (ES6+ / TypeScript for UI)

**Primary Dependencies**: 
- Backend: `fastapi`, `uvicorn`, `opencv-python`, `ultralytics`, `sentence-transformers`, `numpy`, `pytest`
- Frontend: `react`, `vite`, `tailwindcss`, `lucide-react`

**Storage**: SQLite (embedded file database), raw filesystem (local storage for uploaded videos and keyframe JPEG images)

**Testing**: `pytest` for backend, `vitest` or `jest` for frontend

**Target Platform**: Local host environment (macOS/Linux compatible CPU/GPU)

**Project Type**: Multi-module Web Application (separated Backend & Frontend)

**Performance Goals**: 
- Single-frame processing latency (decoding + inference + indexing) < 100ms
- Query similarity ranking < 200ms for up to 10,000 keyframes

**Constraints**: 
- 100% offline-capable (air-gapped operation)
- Memory usage capped under 2 GB during long stream ingestion
- Zero data upload to cloud providers (Local-First privacy)

**Scale/Scope**: 
- Handles individual video file uploads of up to 1 GB
- Max scale of 100 hours of video indexed locally

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Compliance Details / Verification Approach |
|:---|:---|:---|
| **I. High-Performance Multi-Modal Ingestion** | **PASSED** | Video decoding and frame filtering run in a separate background thread/process decoupled from HTTP thread. |
| **II. Local-First Data Privacy** | **PASSED** | All AI models run locally via PyTorch/SentenceTransformers; testing is run with disabled network adapter. |
| **III. Clean Architecture Boundaries** | **PASSED** | Core logic (keyframe extraction, velocity calculation, search) is separated from FastAPI routes, SQLite database adapters, and OpenCV decoder via abstract interfaces. |
| **IV. Test-First Verification** | **PASSED** | Definition of port/interface contract tests (e.g. video decoding interfaces, model output specs) will occur prior to implementing concrete adapters. |
| **V. Strict Resource Management** | **PASSED** | Video reader releases frames immediately after decoding; tensor arrays are cleared from RAM/VRAM post-inference using garbage collection. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-omnisight-video-intelligence/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 technology selections
├── data-model.md        # DB Entity definitions and schemas
├── quickstart.md        # Run and verification instructions
├── contracts/
│   └── api.md           # API endpoint specifications
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── core/            # Domain interfaces and business logic
│   │   ├── ports.py     # Port interfaces (VideoReader, EmbeddingModel, ObjectTracker, Database)
│   │   ├── extractor.py # Keyframe extraction service
│   │   ├── velocity.py  # Velocity tracker service
│   │   └── search.py    # Similarity search service
│   ├── adapters/        # Concrete adapter implementations
│   │   ├── cv2_reader.py       # OpenCV VideoReader adapter
│   │   ├── yolo_tracker.py     # YOLO ObjectTracker adapter
│   │   ├── sentence_transformer_clip.py # CLIP embedding model adapter
│   │   └── sqlite_db.py        # SQLite Database adapter
│   ├── api/             # HTTP Route Handlers
│   │   ├── routes.py
│   │   └── models.py    # Request/Response validation schemas
│   └── main.py          # FastAPI application entrypoint
├── tests/
│   ├── contract/        # Boundary interface verification tests
│   ├── unit/            # Core logic tests (e.g., centroid calculation)
│   └── integration/     # Pipeline flow testing (with offline mock models)
└── requirements.txt

frontend/
├── src/
│   ├── components/      # UI components (VideoPlayer, Gallery, SearchBar)
│   ├── pages/           # Pages (Dashboard, Analytics)
│   ├── services/        # API client modules
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── package.json
├── tailwind.config.js
└── vite.config.js
```

**Structure Decision**: Option 2: Web Application directory structure. Backend server and Frontend SPA reside in distinct directories to enforce clean network boundaries and separate deployment pathways.

---

## Complexity Tracking

*No constitutional violations. Default architecture boundaries and standard libraries are sufficient for the defined user stories.*
