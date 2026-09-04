---
id: backend-python
name: "FastAPI Backend Service (Python 3.12 + uv + Pydantic)"
domain: backend
framework: fastapi
language: python
setup_command: "uv init --app && uv add fastapi uvicorn pydantic"
run_command: "uv run uvicorn app.main:app --reload"
build_command: "uv build"
variables:
  - name: SERVICE_NAME
    description: "FastAPI service name"
    required: true
    default: "fastapi-service"
---

# FastAPI Backend Service Template

Asynchronous, high-performance web API service built on **Python 3.12**, **FastAPI**, **Pydantic v2**, and managed with **uv**.

---

## 1. System Architecture & Request Pipeline

```mermaid
flowchart LR
    subgraph Client ["HTTP Client"]
        Req["HTTP Request (GET /api/v1/health)"]
    end

    subgraph FastAPIEngine ["FastAPI Application (app/main.py)"]
        Req --> Middleware["CORS / Error Middleware"]
        Middleware --> APIRouter["app/api/router.py (APIRouter)"]
        APIRouter --> Endpoints["app/api/v1/endpoints.py"]
    end

    subgraph ServiceCore ["Business Logic & Config"]
        Endpoints --> Services["app/services/ (Service Routines)"]
        Services --> Core["app/core/config.py (Pydantic Settings)"]
        Services --> DB["Database Session / Engine"]
    end

    subgraph Schemas ["Pydantic Validation"]
        Endpoints --> PydanticModel["app/models/schemas.py (BaseModel)"]
        PydanticModel --> JsonResp["JSON Response (Serialization)"]
        JsonResp --> Client
    end
```

---

## 2. Repository Layout

```
backend-python/
├── app/
│   ├── api/                   # API route modules
│   │   ├── v1/
│   │   │   └── endpoints.py
│   │   └── router.py          # APIRouter aggregation
│   ├── core/                  # Settings, database session, logging
│   │   └── config.py
│   ├── models/                # Pydantic schemas & DB models
│   │   └── schemas.py
│   ├── services/              # Business logic routines
│   └── main.py                # FastAPI app initialization & middleware
├── tests/                     # Pytest unit & async client tests
│   └── test_api.py
├── pyproject.toml             # uv & project dependencies
└── README.md
```

---

## 3. Core Boilerplate (`app/main.py`)

```python
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime, timezone

app = FastAPI(
    title="HELIX FastAPI Backend",
    version="1.0.0",
    description="High-performance async REST API",
)

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime

@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
    )
```

---

## 4. Development Commands

```bash
# Install dependencies into virtual environment
uv sync

# Run development server with live reload
uv run uvicorn app.main:app --reload --port 8000

# Run automated tests with pytest
uv run pytest
```
