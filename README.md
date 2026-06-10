# Project Name

This project follows **Spec-Driven Development (SDD)** using the SpecKit framework.

## Spec-Driven Development
We prioritize design and clarity before implementation. No code should be written without corresponding, up-to-date specifications.

## Project Structure
- `specs/`: Contains all functional, technical, and task specifications.
  - `001-core-system/`: The foundation of the project.
    - `spec.md`: Functional requirements and user stories.
    - `plan.md`: Technical architecture and data models.
    - `tasks.md`: Implementation checklist.
- `.specify/memory/`: Contains the project constitution and global guardrails.
- `.gitlab-ci.yml`: CI/CD pipeline configuration.

## Getting Started
1. **Review the Constitution**: Read `.specify/memory/constitution.md` to understand the engineering principles.
2. **Read the Specs**: Check the `specs/` directory for the feature you are working on.
3. **Spec-First**: If you need to make changes, update the `.md` files in `specs/` first and get them approved before writing code.
4. **Follow Tasks**: Use `tasks.md` to track your progress.
