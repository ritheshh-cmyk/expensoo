# Lessons Learned

## Code Modification & Syntax Safety
- **Validate replacement block boundaries**: When using replacement tools, verify that all closing brackets, braces, and punctuation exactly match the syntax rules of the language. Stray characters like `);` or missing braces `}` will cause compilation failures.
- **Run build check immediately**: Always run a build command (`npm run build`) after file edits to detect syntax errors before continuing.

## E2E Testing & State Dependencies
- **Beware of test side-effects**: E2E tests that perform state modifications (such as resetting user passwords) can cause subsequent tests in the same suite to fail if they depend on the original state.
- **Run tests in isolation**: When debugging specific features, run single test files or suites (e.g., `npx playwright test e2e/responsive.spec.ts`) rather than the entire suite, to reduce run time and isolate state.

## Windows Environment Configuration
- **Set environment variables safely**: Standard PowerShell commands like `$env:VAR='val'` can fail in nested cmdlets or CLI tool calls. Prefer standard cmd syntax like `cmd /c "set VAR=val&& command"` for cross-environment consistency on Windows.

## Context & Memory Management
- **Proactively use agentmemory**: Every time you modify files, apply updates, or finalize a session, proactively use the `agentmemory` MCP server (specifically the `memory_save` tool) to log the session context, files touched, and architectural decisions. This ensures that context is durably persisted across sessions and reduces token bloat from repetitive scanning.
- **Always adhere to global and local rules**: At the start of any task, check for and strictly follow global rules defined in `gemini.md` or `claude.md` from both the local repository context and any global/system context available. These rule files govern agent behavior and must be prioritized.
