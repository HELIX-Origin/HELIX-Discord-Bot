# Rule 01: Zero External AI & Local Plugin Execution

## Mandatory Invariants
1. **No External AI APIs**: HELIX does not integrate with any external AI providers (OpenAI, Anthropic, Google Gemini, Ollama, etc.). Zero paid or third-party LLM API dependencies are permitted.
2. **Local Static Intelligence**: All code support, linting, explanation, and error diagnosis must be implemented via local AST parsers, regex engines, built-in linters, or official documentation cross-references within `HELIX/src/plugins/`.
3. **In-Process Execution**: Community and official plugins must execute 100% in-process without spawning remote AI inference calls or requiring user API keys.
