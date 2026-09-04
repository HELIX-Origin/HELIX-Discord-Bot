# Skill: Modern Python Development

## Overview
Standards and code recipes for modern Python backend applications using `uv` / `poetry`, strict typing, `FastAPI`, and `ruff`.

## Recommended Stack
- **Package & Environment Manager**: `uv` (extremely fast Rust-based Python package manager)
- **Web Framework**: FastAPI (asynchronous REST & WebSocket APIs)
- **Validation**: Pydantic v2
- **Linter & Formatter**: `ruff`
- **Type Checker**: `mypy` or `pyright`

## Initialization Recipe
```bash
# Initialize project with uv
uv init --app my-python-service
cd my-python-service
uv add fastapi uvicorn pydantic
uv add --dev ruff mypy pytest pytest-asyncio
```

## FastAPI Application Pattern (`src/app/main.py`)
```python
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime, timezone

app = FastAPI(title="HELIX Backend Service", version="0.1.0")

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime

@app.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc)
    )
```

## Code Quality Verification
```bash
# Format code
uv run ruff format .

# Check lint rules
uv run ruff check . --fix

# Run static type analysis
uv run mypy src/

# Run tests
uv run pytest
```
