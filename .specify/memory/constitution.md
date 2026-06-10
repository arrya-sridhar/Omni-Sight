# Project Constitution

## 1. Engineering Guardrails
- **Consistency**: All code must follow the established architectural patterns.
- **Safety**: Prefer immutable data structures and pure functions where possible.
- **Documentation**: All public APIs and complex logic must be documented.

## 2. Strict Typing Principles
- **Mandatory Typing**: All codebases must utilize strict typing (e.g., TypeScript, Python Type Hints, etc.).
- **No `any`**: The use of `any` or equivalent "escape hatches" is strictly forbidden unless explicitly justified in a specification.
- **Type Safety**: Interfaces and Types should be defined before implementation.

## 3. Architectural Separation of Concerns
- **Domain Logic**: Business rules must be isolated from delivery mechanisms (web, CLI, API).
- **Dependency Inversion**: High-level modules should not depend on low-level modules. Both should depend on abstractions.
- **Modular Design**: Features should be encapsulated in their own modules/directories.

## 4. Spec-First Rule
- **No Code Without Spec**: No implementation code is to be written until the corresponding specification in `specs/` has been updated and reviewed.
- **Tracking**: Changes to functionality must be reflected in the specs before they are reflected in the code.
- **Single Source of Truth**: The `specs/` directory is the authoritative source for feature behavior and technical design.
