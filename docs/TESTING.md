# Testing Guide

Expensoo features a robust, multi-layer testing pipeline. All pull requests must pass the test suite prior to merging.

## 🎭 End-to-End (E2E) Testing
E2E testing is conducted using **Playwright** against a running local development server.

- **Run all E2E tests**:
  ```bash
  npx playwright test
  ```
- **Test suite files** (located in `e2e/`):
  - `comprehensive-qa.spec.ts`: Validates complete application flows (Auth, Dashboard, Suppliers, Bills, Settings, RBAC).
  - `vercel_transactions.spec.ts`: Checks stats counters and verifies page loads under different user roles.
  - `supplier_edit_delete.spec.ts`: Tests the full CRUD lifecycle of supplier records.
  - `responsive.spec.ts`: Validates visual layout correctness at 390px mobile viewports.

## ⚡ Unit Testing
Unit tests are managed via **Vitest**.

- **Run unit tests**:
  ```bash
  npx vitest run src/
  ```

## ⚙️ Custom Integration Checks
A custom Node.js script validates file architecture conventions, dependencies, and Tippy/Joyride options:

- **Run integration checks**:
  ```bash
  node test-integrations.cjs
  ```
