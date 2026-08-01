# Bolt's Journal - Critical Learnings Only

## 2025-02-28 - Monorepo Lockfile Integrity and Subdirectory Package Management
**Learning:** In workspaces or monorepos configured with PNPM, running raw install commands or workspace-wide recursive commands can inadvertently mutate the root `pnpm-lock.yaml` or create redundant nested lockfiles in subfolders (e.g., `client/pnpm-lock.yaml`). This decouples dependency management, corrupts the shared root state, and can cause CI/CD or production build failures.
**Action:** Always run workspace-aware dependency commands strictly from the repository root, and never commit/generate nested lockfiles or make modifications to existing monorepo package structures unless instructed. Double check `git status` before committing to ensure `pnpm-lock.yaml` remains pristine and intact.
