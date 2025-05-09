# SUGGESTIONS.md – Documentation and Structure Improvements

## 1. Move `TECHNICAL.md` to `/docs/`

- Create a new `docs/` folder if it doesn't exist.
- Move `TECHNICAL.md` into: `docs/TECHNICAL.md`
- Update the README link to point to the new location.
- Example shell commands:

  ```bash
  mkdir -p docs
  mv TECHNICAL.md docs/TECHNICAL.md
  ```

- Remember to update any other references to TECHNICAL.md in other files (e.g., CODEOWNERS, CI config).

## 2. Add Summary Paragraph at Top of `TECHNICAL.md`

- Include a short summary at the top of the file, before any content or table of contents.
- Example:

  > This document describes internal assumptions, behaviors, and edge cases for the issue-labeler tool. It outlines what the system does and does not do, and clarifies the scope of input, output, and side effects.

## 3. Align With Current Test Strategy

- As integration tests expand (mock or real), ensure they reflect behaviors and assumptions documented in `TECHNICAL.md`.
- This creates a two-way alignment between documentation and testing over time.
- See Phase 1 of PLAN.md for the planned integration test refactor that should maintain this alignment.
