# Task: Fix `about:blank#blocked` for Install / Update Links

## Context
When a user clicks on the **"Install →"**, **"Update →"**, or **"Or download manually →"** links in the frontend application, the browser opens a new tab that shows `about:blank#blocked`. This happens because the AI analysis backend can return weird, malformed, or protocol-less values for `install_url` (like `"www.python.org"`, `"N/A"`, `""`, or string `"null"`). When `<a href={tool.install_url} target="_blank">` receives these malformed values, the browser's security policies (especially in Chrome/Brave) intercept it as an invalid cross-origin popup or relative trap and block it.

## Objectives
1. **Locate Link Renders:** Review `frontend/src/components/ToolCard.tsx` and `frontend/src/components/DownloadModal.tsx` where `tool.install_url` is used in `href` attributes.
2. **Implement URL Validation & Formatting Helper:**
   Create a utility function (e.g., `formatValidUrl(url: string | undefined | null): string | null`) that:
   - Returns `null` if the string is empty, `"N/A"`, `"-"`, `"null"`, or generally invalid.
   - Automatically prepends `https://` if the URL lacks a schema (e.g. `python.org` -> `https://python.org`).
3. **Apply Helper to UI:**
   - In `ToolCard.tsx` and `DownloadModal.tsx`, parse `tool.install_url` through this helper before deciding to render the anchor `<a>` tag.
   - If the helper returns `null`, do not render the install/update link at all.
   - Provide the cleaned, fully-qualified URL to the `href` attribute to satisfy the `target="_blank"` browser security requirements.

## Files to Edit
- `frontend/src/components/ToolCard.tsx`
- `frontend/src/components/DownloadModal.tsx`
- `frontend/src/utils/urlFormatter.ts` (new file for the helper, or place it inside `frontend/src/types/index.ts` or `frontend/src/utils/index.ts`)

## Acceptance Criteria
- Clicking "Install" or "Update" opens the correct external webpage rather than an `about:blank#blocked` page.
- Tools lacking a valid URL (returned as `"N/A"`, etc. by the AI) gracefully omit the link.
- Links missing `http://` or `https://` work correctly.
