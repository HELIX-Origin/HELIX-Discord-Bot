# Rule 03: Centralized Message & Embed Formatting

## Mandatory Invariants
1. **Single Source of Truth**: All user-facing strings, embed layouts, error messages, and log formats must be defined in `HELIX/src/messages.json`.
2. **No Inline Embed Construction**: Never construct ad-hoc `EmbedBuilder` instances with hardcoded strings directly in command files. Always use `createEmbed(key, vars, prefix)` from `message-handler.ts`.
3. **Unified Error Reporting**: Always format user errors with `formatError(keyOrMsg, vars, prefix)` to guarantee consistent styling and prefix interpolation.
4. **Variable Interpolation**: Use `{variableName}` syntax inside `messages.json` and pass matching key-value pairs in the `vars` object.
