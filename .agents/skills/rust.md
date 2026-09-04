# Skill: Rust Development

## Overview
Standards and code recipes for building memory-safe, ultra-performant backend services, CLI applications, and libraries using modern Rust.

## Standard Tooling & Crates
- **Runtime**: Tokio (`tokio = { version = "1", features = ["full"] }`)
- **Web Framework**: Axum or Actix-Web
- **Serialization**: Serde (`serde = { version = "1", features = ["derive"] }`)
- **Error Handling**: `thiserror` for library domain errors, `anyhow` for application orchestration
- **Observability**: `tracing` and `tracing-subscriber`

## Axum REST API Starter (`src/main.rs`)
```rust
use axum::{routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tracing_subscriber;

#[derive(Serialize, Deserialize)]
struct StatusResponse {
    status: String,
    service: String,
}

async fn health_check() -> Json<StatusResponse> {
    Json(StatusResponse {
        status: "ok".into(),
        service: "helix-backend".into(),
    })
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new().route("/health", get(health_check));
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

## Quality & Verification Commands
```bash
# Check compiler errors quickly without full codegen
cargo check

# Run automated tests
cargo test

# Run strict linter
cargo clippy -- -D warnings

# Format source code
cargo fmt --check
```
