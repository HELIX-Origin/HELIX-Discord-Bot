# Backend Languages Agent

This agent provides conventions, architecture, and workflow standards for backend engineering across **Rust**, **Go**, **Java**, and **Python**.

## Architecture & Structures

### 1. Rust (Cargo)
```
rust-service/
├── src/
│   ├── main.rs               # Binary entry point
│   ├── lib.rs                # Library interface (for testability)
│   ├── api/                  # Axum/Actix HTTP handlers
│   ├── domain/               # Business models
│   └── repository/           # Database layer (SQLx)
├── Cargo.toml                # Dependencies & package metadata
└── README.md
```

### 2. Go (Modules)
```
go-service/
├── cmd/
│   └── server/
│       └── main.go           # CLI/Server entry point
├── internal/                 # Private package code
│   ├── handler/              # HTTP / gRPC handlers
│   ├── service/              # Business logic
│   └── store/                # Database persistence
├── pkg/                      # Exported library packages
├── go.mod                    # Module definition
├── go.sum                    # Dependency checksums
└── Makefile                  # Build & test automation
```

### 3. Java (Maven / Spring Boot)
```
java-service/
├── src/
│   ├── main/java/com/helix/service/
│   │   ├── Application.java
│   │   ├── controller/
│   │   ├── model/
│   │   └── service/
│   └── main/resources/
│       ├── application.yml
│       └── application-dev.yml
├── pom.xml                   # Maven dependencies & plugins
└── README.md
```

### 4. Python (uv / FastAPI)
```
python-service/
├── src/
│   └── app/
│       ├── __init__.py
│       ├── main.py           # FastAPI app instance
│       ├── api/              # Routers (v1/v2)
│       ├── core/             # Config and settings
│       └── models/           # Pydantic & SQLAlchemy models
├── pyproject.toml            # Project packaging & uv config
├── .env.example
└── README.md
```

## Setup & Scaffolding Commands

```bash
# Rust
helix create backend my-rust --template backend-rust
cargo run
cargo test

# Go
helix create backend my-go --template backend-go
go run ./cmd/server
go test ./...

# Java
helix create backend my-java --template backend-java
./mvnw spring-boot:run
./mvnw test

# Python
helix create backend my-python --template backend-python
uv sync
uv run fastapi dev src/app/main.py
```

## Core Standards

- **Rust**: Enforce zero unwrap in production code (`Result<T, E>`), leverage `tracing` for observability, and run `cargo clippy -- -D warnings`.
- **Go**: Follow Standard Go Project Layout, avoid global variables, handle errors explicitly, and enforce `golangci-lint`.
- **Java**: Build with Java 21 LTS, use constructor injection for Spring beans, record types for immutable DTOs, and Testcontainers for integration testing.
- **Python**: Enforce strict type hints with `mypy` or `pyright`, use `ruff` for formatting and linting, and isolate environments with `uv` or `poetry`.
