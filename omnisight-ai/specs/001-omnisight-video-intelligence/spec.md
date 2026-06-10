# Feature Specification: OmniSight AI - Multi-Modal Video Intelligence System

**Feature Branch**: `001-omnisight-video-intelligence`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Build a multi-modal video intelligence system named OmniSight AI that handles lightweight key frame extraction, object velocity tracking, and zero-shot natural language vector-based search queries."

## Clarifications

### Session 2026-06-10

- Q: Should velocity tracking support camera calibration parameters for real-world speed conversion, or is pixel-per-second tracking sufficient for the MVP? → A: Pixel-per-second tracking only for MVP.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Natural Language Zero-Shot Search Queries (Priority: P1)

An analyst wants to search through a collection of security/traffic footage by entering natural language queries (e.g., "red car speeding near intersection", "person walking a dog at night") and instantly get the exact timestamps and video segments where these events occur. The search must work zero-shot (without training on specific classes) and preserve data privacy (completely locally).

**Why this priority**: Zero-shot natural language search is the core value proposition that enables immediate, intuitive discovery of key video events without manual tag creation or custom model training.

**Independent Test**: Can be fully tested by loading pre-processed mock video frame embeddings, executing a query like "blue truck", and validating that relevant frame matches are retrieved within latency limits.

**Acceptance Scenarios**:

1. **Given** a video has been indexed with multi-modal embeddings, **When** a user searches for "a person wearing a yellow jacket", **Then** the system returns a list of matching video segments with correct timestamp intervals and relevance scores.
2. **Given** a search query is executed, **When** the system is operating in a completely offline/air-gapped environment, **Then** the search executes successfully with zero external network requests.

---

### User Story 2 - Object Velocity Tracking (Priority: P2)

A traffic planner or security administrator wants the system to track objects (e.g., vehicles, pedestrians) across consecutive video frames, compute their velocities, and flag instances where objects exceed a velocity threshold (e.g., speeding vehicles or running individuals).

**Why this priority**: Velocity tracking builds on the frame extraction pipeline to provide actionable spatial-temporal insights (velocity, pathing, speed anomalies) that go beyond static image searching.

**Independent Test**: Can be tested by feeding a synthetic series of frames with a moving bounding box at constant pixel displacement, and verifying that the system calculates the correct velocity and detects when it exceeds a target threshold.

**Acceptance Scenarios**:

1. **Given** a video contains a vehicle moving across the field of view, **When** the system processes the video, **Then** it tracks the vehicle's unique identity across frames and records its velocity.
2. **Given** a user sets a velocity threshold, **When** an object is detected exceeding that threshold, **Then** the system generates a velocity alert metadata record linked to that video segment.

---

### User Story 3 - Lightweight Key Frame Extraction (Priority: P3)

An operator wants to ingest a large video file without bloating local storage or slowing down inference. The system should intelligently filter out redundant frames (e.g., static backgrounds, near-identical frames) and extract only significant "key frames" (representing scene changes, new objects, or major motion) for multi-modal embedding generation.

**Why this priority**: Key frame extraction optimizes resource consumption (processing time, storage, memory) by preventing redundant inference on near-identical consecutive frames, ensuring compliance with the system's latency budget.

**Independent Test**: Can be tested by ingesting a video with 10 seconds of static scene followed by 5 seconds of rapid action, and verifying that the number of extracted key frames during the static period is extremely low, while the action period yields higher frame density.

**Acceptance Scenarios**:

1. **Given** a video file is submitted for ingestion, **When** the key frame extraction pipeline runs, **Then** the total number of frames passed to the downstream vector embedding pipeline is reduced by at least 75% compared to the raw frame count, while preserving all major event boundaries.
2. **Given** a real-time stream is ingested, **When** key frame extraction detects a scene boundary change, **Then** the frame is immediately pushed to the vector indexing pipeline in parallel.

### Edge Cases

- **Video Ingestion with High Noise/Artifacts**: The system must degrade gracefully, filtering noise during key frame extraction without dropping key events or causing pipeline crashes.
- **Temporary Object Occlusions**: The object tracker must handle temporary occlusions (up to 5 frames) where an object is blocked by another object, retaining the tracker ID once the object reappears.
- **Out of Memory under Large/Infinite Streams**: The system must process videos chunk-by-chunk and release references to processed frames immediately, preventing memory leaks and capping maximum memory footprint.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST process input videos locally, extracting frames without sending any raw data or metadata to external cloud services.
- **FR-002**: The key frame extraction component MUST filter out redundant frames based on visual similarity metrics before sending them to the representation encoding model.
- **FR-003**: The object velocity tracking component MUST locate objects, assign persistent IDs across frames, and calculate object speed based on frame rate and coordinate shifts.
- **FR-004**: The vector search component MUST generate embeddings from the user's natural language query and return matching frames ranked by cosine similarity.
- **FR-005**: The system MUST store metadata, tracking logs, and vector embeddings in a local embedded database.
- **FR-006**: The frame processing pipeline MUST be parallelized and decoupled from video stream ingestion, maintaining a frame processing latency under 100ms per frame.
- **FR-007**: The system MUST provide clean adapter interfaces for video decoding, model inference, and vector/metadata storage to ensure framework independence.
- **FR-008**: The object tracker MUST track and calculate object velocity strictly in pixels/second (relative motion) across consecutive frames, without requiring camera calibration parameters.

### Key Entities *(include if feature involves data)*

- **Video**: Represents a video source file or stream. Attributes: ID, path, duration, frame rate, resolution, status.
- **KeyFrame**: Represents a significant frame extracted from a video. Attributes: Frame index, timestamp, embedding vector, image reference.
- **TrackedObject**: Represents an object tracked across frames. Attributes: Track ID, class label, confidence, velocity history, trajectory (bounding box sequence).
- **SearchQuery**: Represents a natural language search query. Attributes: Text, embedding vector, search configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of natural language search queries must return results under 200ms.
- **SC-002**: Key frame extraction must reduce the number of frames requiring embedding generation by at least 75% for typical surveillance videos.
- **SC-003**: Object velocity tracking must maintain correct track identities through temporary partial occlusions lasting up to 5 frames.
- **SC-004**: The system must run completely offline, with all automated tests passing with network interfaces disabled.
- **SC-005**: Memory usage during processing of a 1-hour 1080p video stream must remain bounded and not exceed 2 GB.

## Assumptions

- **A-001**: Ingested videos will have standard formats (e.g., MP4, MKV) and frame rates (e.g., 24fps, 30fps).
- **A-002**: The host environment runs on hardware capable of executing lightweight neural models locally (CPU or local GPU).
- **A-003**: Users search using English natural language queries.
- **A-004**: The video stream is stationary (fixed camera angle) for velocity calculations, and relative motion tracking (pixels/second) is sufficient for identifying speed anomalies.
