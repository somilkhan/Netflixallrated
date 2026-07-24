# Palette's Journal - Allrated Cinema

## 2025-02-15 - TypeScript Enforced Accessibility (IconButton)
**Learning:** Forcing accessibility attributes (like `aria-label`) at the type-definition level for custom, generic icon-only buttons (e.g., `IconButton`) guarantees accessibility compliance at compilation time. This prevents other developers from accidentally adding inaccessible, unlabeled icon buttons in future development.
**Action:** Extend generic props in custom components (like `IconButtonProps`) to mandate crucial accessibility properties, and solve any immediate typescript compile-time errors in the codebase by providing proper descriptive accessibility labels.
