## Summary

**Phase: Suppliers Delete Confirmation and Profile Upgrades**
**Goal:** Implement robust supplier deletion via custom ConfirmModal, and enhance profile page with drag-and-drop avatar upload.
**Status:** Verified ✓

This PR introduces two main enhancements:
1. **Supplier Deletion Flow:** Adds a custom ConfirmModal for deleting suppliers (replacing window.confirm calls) and wires it up to the supplier detail dialog. On confirm, the supplier is deleted via the API and immediately removed from the UI list.
2. **Profile Avatar drag-and-drop:** Migrates the user profile page from basic button selection to a modern drag-and-drop zone using the new `AvatarDropzone` component.

## Changes
- `src/pages/Suppliers.tsx`: Integrated ConfirmModal and fixed handling from the detail dialog.
- `src/pages/Profile.tsx`: Replaced standard file selector button with `AvatarDropzone` component.
- `src/components/ui/AvatarDropzone.tsx`: New component implementing drag-and-drop area for image uploading.
- `e2e/`: Added regression test specs for local fixes and supplier editing/deleting.

## Verification
- [x] E2E Puppeteer test suite executed locally and passes successfully.
- [x] Detail delete dialog flow tested specifically with a custom test script and verified.
- [x] TypeScript compiler check passes without errors (`tsc --noEmit`).
