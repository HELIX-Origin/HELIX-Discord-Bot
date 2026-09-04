# Skill: Go Development

## Overview
Standards and code recipes for creating robust, concurrent services and CLI tools in Go.

## Project Structure (Standard Go Project Layout)
- `cmd/<binary-name>/main.go`: Application entry point.
- `internal/`: Private code packages un-importable by external projects.
- `pkg/`: Public library code for external re-use.
- `go.mod` / `go.sum`: Dependency tracking.

## Standard HTTP Service Starter (`cmd/server/main.go`)
```go
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	resp := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now(),
	}
	_ = json.NewEncoder(w).Encode(resp)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Println("Server starting on http://localhost:8080")
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}
}
```

## Essential Commands
```bash
# Initialize new Go module
go mod init github.com/user/helix-service

# Format, vet, and test
go fmt ./...
go vet ./...
go test -v -race ./...

# Run the binary
go run ./cmd/server
```
