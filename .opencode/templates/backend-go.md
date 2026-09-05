---
id: backend-go
name: "Go REST API Backend (Go 1.22+ Standard Net/HTTP / Chi)"
domain: backend
framework: go-standard
language: go
setup_command: "go mod init github.com/user/my-go-backend"
run_command: "go run ./cmd/server"
build_command: "go build -o bin/server ./cmd/server"
variables:
  - name: MODULE_NAME
    description: "Go module path"
    required: true
    default: "github.com/helix/go-backend"
---

# Go REST API Backend Template

Idiomatic Go web service following standard project layout (`cmd/`, `internal/`, `pkg/`) with structured logging and graceful shutdown.

---

## 1. System Architecture & Project Topology

```mermaid
flowchart LR
    subgraph Client ["HTTP Request"]
        Req["GET /health, POST /api"]
    end

    subgraph GoServer ["cmd/server/main.go (Server & Lifecycle)"]
        Req --> Mux["http.NewServeMux() (Go 1.22+ Routing)"]
        Mux --> Middleware["Logging & Recovery Middleware"]
        Middleware --> Handler["internal/handler/ (HTTP Handlers)"]
    end

    subgraph InternalLogic ["internal/ (Core Application)"]
        Handler --> Service["internal/service/ (Business Logic)"]
        Service --> Config["internal/config/ (Env Configuration)"]
        Service --> DB["Database / Persistence"]
    end

    subgraph Response ["JSON Output"]
        Handler --> JSON["json.NewEncoder(w).Encode()"]
        JSON --> Client
    end
```

---

## 2. Repository Layout

```
backend-go/
├── cmd/
│   └── server/
│       └── main.go            # Entrypoint & server lifecycle
├── internal/
│   ├── config/                # Environment config loader
│   │   └── config.go
│   ├── handler/               # HTTP request handlers
│   │   └── health.go
│   └── service/               # Business logic layer
├── go.mod                     # Go module definition
├── go.sum
└── README.md
```

---

## 3. Core Boilerplate (`cmd/server/main.go`)

```go
package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"
)

type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(HealthResponse{
		Status:    "ok",
		Timestamp: time.Now(),
	})
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	slog.Info("Starting Go backend server", "port", 8080)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("Server failed", "error", err)
	}
}
```
