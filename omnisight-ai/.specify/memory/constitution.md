<!--
SYNC IMPACT REPORT
- Version change: None → 1.0.0
- List of modified principles:
  * Principle 1: High-Performance Multi-Modal Video Processing (Initial)
  * Principle 2: Local-First Data Privacy (Initial)
  * Principle 3: Clean Architecture Boundaries (Initial)
  * Principle 4: Test-First Verification (NON-NEGOTIABLE) (Initial)
  * Principle 5: Strict Resource Management (Initial)
- Added sections:
  * Performance and Privacy Constraints
  * Development Workflow and Quality Gates
- Removed sections: None
- Templates requiring updates:
  * .specify/templates/plan-template.md (✅ verified/aligned)
  * .specify/templates/spec-template.md (✅ verified/aligned)
  * .specify/templates/tasks-template.md (✅ verified/aligned)
- Follow-up TODOs: None
-->

# OmniSight AI Constitution

## Core Principles

### I. High-Performance Multi-Modal Video Processing
- **Parallel Processing Pipelines**: All video ingestion, decoding, frame/audio extraction, and representation encoding must be executed in parallel pipelines to prevent bottlenecks.
- **Hardware Acceleration**: Leverage available local GPU/NPU acceleration for neural model execution and video encoding/decoding.
- **Zero-Copy Memory Transfers**: Minimize memory copy overhead by utilizing shared memory and zero-copy buffers for large video frames and tensors.
- **Decoupled Extraction**: Decouple real-time stream ingestion from feature extraction and metadata storage to avoid dropping frames.

### II. Local-First Data Privacy
- **Zero Cloud Leakage**: No raw video footage, individual frame tensors, or processed metadata database files may be uploaded to external cloud endpoints.
- **Local Inference**: All multi-modal AI models (object detection, embedding generators, LLMs) must run entirely on local execution runtimes.
- **Air-Gapped Operation**: The core system must remain fully functional and performant without active internet connectivity.
- **Sandboxed Verification**: Automated test suites must run with simulated offline environments to verify no unauthorized external calls are initiated.

### III. Clean Architecture Boundaries
- **Framework Independence**: Core business logic, domain entities, and processing pipelines must remain independent of database engines, UI frameworks, and external API libraries.
- **Strict Dependency Rule**: Source code dependencies must point inward. Outer layers (UI, databases, frameworks, external decoders) must depend only on the inner domain core, never vice versa.
- **Port and Adapter Interfaces**: Communication across architectural boundaries must go through abstract ports (interfaces) implemented by external adapters.
- **Clear Boundary Enforcement**: Subsystems (e.g., video decoding, model inference, database storage) must be isolated with zero coupling except through defined boundary contracts.

### IV. Test-First Verification (NON-NEGOTIABLE)
- **TDD Requirement**: Code changes must be driven by tests. Define boundary and contract tests before implementing interfaces.
- **Independent Story Testing**: Every user story must be independently testable, with unit and integration tests verifying the exact acceptance criteria.
- **Boundary Tests**: Implement strict contract tests at every architectural boundary to verify that mock/real implementations satisfy interface requirements.

### V. Strict Resource Management
- **Resource Disposal**: Large video segments, audio tracks, and high-dimensional embeddings must be explicitly freed from memory as soon as their processing step completes.
- **Memory Leak Protection**: Core pipelines must be profiled for memory leaks. CI builds must verify that memory footprint remains bound during continuous stream processing.
- **Simplicity & YAGNI**: Focus only on the required features for current user stories. Avoid pre-optimizing code paths or introducing complex abstractions unless justified by profiling.

## Performance and Privacy Constraints
- **Latency Budget**: Processing latency for individual video frames (decoding + inference + indexing) must not exceed 33ms for real-time 30fps video streams, or 100ms for high-accuracy multi-modal analysis.
- **Storage Bounds**: The local index and metadata database must use optimized storage layouts (such as localized SQLite or lightweight vector indexes) with a maximum storage budget per processed video hour.

## Development Workflow and Quality Gates
- **Dependency Boundary Check**: Static analysis or strict code reviews must verify that core domain modules do not import external packages or framework-specific utilities.
- **Local-First Compliance Verification**: Before merging any feature, developers must run the test suite with network access disabled to verify offline compatibility.
- **Performance Regression Gate**: Multi-modal model execution times and frame processing throughput must be measured and compared against the baseline during performance review gates.

## Governance
- **Amendment Process**: Any amendments to this constitution require a formal pull request detailing the proposed principle modifications, the rationale, and the version bump.
- **Compliance Reviews**: Compliance with these principles must be verified during plan reviews and before task execution. Any violations must be justified and recorded in the implementation plan's Complexity Tracking section.
- **Version Policy**: Major versions for backward-incompatible rule changes; Minor versions for new sections/principles; Patch versions for non-semantic clarifications.

**Version**: 1.0.0 | **Ratified**: 2026-06-10 | **Last Amended**: 2026-06-10
