# Development Guidelines

This document outlines the coding standards, styling conventions, and validation frameworks to follow when contributing to Expensoo.

## 📐 Coding Standards
- **TypeScript**: All new code must be fully typed. Avoid the use of `any` where possible.
- **Strict Checks**: Ensure type validity by running the type check script before commits:
  ```bash
  npm run type-check
  ```

## 🎨 Layout & Styling Rules
- **CSS Variable Design**: Use predefined HSL tokens in `src/index.css` for consistent backgrounds, borders, and brand accents (`--primary`, `--brand-green`, `--brand-blue`, etc.).
- **Mobile First**: Design components to scale down to `375px` and `390px` viewports cleanly. Charts must be full-width, and tables must collapse into card-list views on mobile.
- **Touch Targets**: Interactive buttons and inputs must have a minimum tap target height of `44px` on mobile viewports.

## 📝 Form Valdation & Inputs
- **Zod & Forms**: Define validation schemas with Zod, and render fields using the `FieldInputGroup` atomic component.
- **Custom Modals**: Never use native browser dialogs like `window.confirm`. Use the `useConfirm()` hook to display smooth, animated, portal-based modal overlays:
  ```typescript
  const { confirm, ConfirmModalElement } = useConfirm();
  // ...
  const ok = await confirm({ title: "Are you sure?", message: "This action cannot be undone." });
  ```
