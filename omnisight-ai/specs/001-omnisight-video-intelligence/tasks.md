# Tasks: OmniSight AI Multi-Modal Video Intelligence System

**Input**: Design documents from `/specs/001-omnisight-video-intelligence/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included in all user story phases as mandated by the Test-First Verification (TDD) principle of the OmniSight AI Constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, directory structuring, and dependency installation.

- [x] T001 Create backend and frontend folder structures at `backend/` and `frontend/`
- [x] T002 Initialize Python FastAPI project with required dependencies in `backend/requirements.txt`
- [x] T003 [P] Initialize React project with Vite and Tailwind CSS in `frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core local-first services, database adapters, and routing setups.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Implement SQLite database schema initialization for Video, KeyFrame, and TrackedObject in `backend/src/adapters/sqlite_db.py`
- [x] T005 [P] Define core domain port interfaces for VideoReader, ObjectTracker, EmbeddingModel, and Database in `backend/src/core/ports.py`
- [x] T006 [P] Configure global error handler and logging templates in `backend/src/main.py`
- [x] T007 Setup FastAPI app instance, main router routes, and CORSMiddleware in `backend/src/main.py`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Natural Language Zero-Shot Search Queries (Priority: P1) 🎯 MVP

**Goal**: Query indexed keyframe embeddings using natural language queries and return top matching segments locally.

**Independent Test**: Execute a POST request to `/api/search` with a mock search query and assert it matches a mock keyframe embedding with the correct similarity score without network calls.

### Tests for User Story 1
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Write contract tests verifying request/response schemas for `/api/search` in `backend/tests/contract/test_search.py`
- [x] T009 [P] [US1] Write integration tests verifying that CLIP model embedding extraction and NumPy similarity search return correct ranked results in `backend/tests/integration/test_search.py`

### Implementation for User Story 1

- [x] T010 [P] [US1] Implement CLIP embedding model adapter using SentenceTransformers in `backend/src/adapters/sentence_transformer_clip.py`
- [x] T011 [US1] Implement similarity search service calculating cosine similarity in-memory using NumPy in `backend/src/core/search.py`
- [x] T012 [US1] Implement endpoint handlers `/api/search` and keyframe image download `/api/keyframes/{id}/image` in `backend/src/api/routes.py`
- [x] T013 [US1] Implement frontend search input bar, similarity thresholds, and thumbnail results gallery in `frontend/src/components/SearchBar.jsx` and `frontend/src/components/Gallery.jsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Object Velocity Tracking (Priority: P2)

**Goal**: Track moving objects across frames, compute their velocity in pixels/second, and raise speed alerts.

**Independent Test**: Feed a synthetic sequence of frame coordinates with constant pixel movement into the velocity tracker and verify correct velocity and speed alert triggers.

### Tests for User Story 2

- [x] T014 [P] [US2] Write contract tests verifying `/api/videos/{id}/tracks` endpoint schema in `backend/tests/contract/test_tracking.py`
- [x] T015 [P] [US2] Write integration tests validating centroid tracking ID matching and displacement calculations in `backend/tests/integration/test_tracking.py`

### Implementation for User Story 2

- [x] T016 [P] [US2] Implement ObjectTracker adapter using YOLOv8-nano and centroid tracking logic in `backend/src/adapters/yolo_tracker.py`
- [x] T017 [US2] Implement velocity calculator service calculating pixels/second displacement in `backend/src/core/velocity.py`
- [x] T018 [US2] Implement API route for retrieving tracks `/api/videos/{id}/tracks` in `backend/src/api/routes.py`
- [x] T019 [US2] Implement frontend canvas overlay for tracked objects in `frontend/src/components/VideoPlayer.jsx` and velocity dashboard in `frontend/src/pages/Analytics.jsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Lightweight Key Frame Extraction (Priority: P3)

**Goal**: Decode videos and filter redundant frames using histogram differences to keep only significant keyframes.

**Independent Test**: Run keyframe extraction on a 15-second video (10s static, 5s motion) and assert that keyframe rate is reduced by >=75% while keeping the motion frames.

### Tests for User Story 3

- [x] T020 [P] [US3] Write contract tests verifying `/api/videos/upload` multi-part request/response schemas in `backend/tests/contract/test_extractor.py`
- [x] T021 [P] [US3] Write integration tests verifying that OpenCV decoding and frame filtering accurately extract key frames in `backend/tests/integration/test_extractor.py`

### Implementation for User Story 3

- [x] T022 [P] [US3] Implement VideoReader adapter using OpenCV (`cv2`) in `backend/src/adapters/cv2_reader.py`
- [x] T023 [US3] Implement frame difference extractor calculating histogram changes in `backend/src/core/extractor.py`
- [x] T024 [US3] Connect backend route `/api/videos/upload` executing keyframe extraction and tracking in parallel background worker threads in `backend/src/api/routes.py`
- [x] T025 [US3] Implement frontend video upload container and background progress tracking component in `frontend/src/components/VideoUpload.jsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Environmental configurations, memory profiling, and end-to-end validation.

- [x] T026 Configure backend environment variables (`backend/src/main.py`) and frontend proxy settings (`frontend/vite.config.js`)
- [x] T027 Perform memory profiling on the video decoding pipeline to verify memory remains bound (<2GB) during stream ingestion
- [x] T028 Run the quickstart verification guide in `specs/001-omnisight-video-intelligence/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel (if staffed).
  - Or sequentially in priority order (P1 → P2 → P3).
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- Setup tasks T002 and T003 can run in parallel.
- Foundational tasks T005, T006, and T007 can run in parallel.
- Once Foundational completes, US1, US2, and US3 implementation can run in parallel.
- Within US1, contract tests (T008) and integration tests (T009) can run in parallel.
- Within US2, contract tests (T014) and integration tests (T015) can run in parallel.
- Within US3, contract tests (T020) and integration tests (T021) can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Run both test suites for User Story 1 together:
Task T008: "Write contract tests verifying request/response schemas for /api/search in backend/tests/contract/test_search.py"
Task T009: "Write integration tests verifying CLIP model embedding extraction and NumPy similarity search return correct ranked results in backend/tests/integration/test_search.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Zero-Shot Search Queries)
4. **STOP and VALIDATE**: Test User Story 1 independently using mock data.
5. Demo and verify MVP.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories.
