import { FileToGenerate } from '../file-generator.js';

export function generateBackendFiles(
  projectName: string,
  language: 'rust' | 'go' | 'java' | 'python',
  variables: Record<string, string>
): FileToGenerate[] {
  if (language === 'rust') {
    const port = variables.PORT || '3000';
    return [
      {
        relativePath: 'Cargo.toml',
        content: `[package]
name = "${projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tracing = "0.1"
tracing-subscriber = "0.3"
`,
      },
      {
        relativePath: 'src/main.rs',
        content: `use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::net::SocketAddr;

#[derive(Serialize)]
struct StatusResponse {
    status: &'static str,
    project: &'static str,
}

async fn health_check() -> Json<StatusResponse> {
    Json(StatusResponse {
        status: "ok",
        project: "${projectName}",
    })
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new().route("/health", get(health_check));
    let addr = SocketAddr::from(([0, 0, 0, 0], ${port}));
    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
`,
      },
    ];
  }

  if (language === 'go') {
    const modName = variables.MODULE_NAME || `github.com/user/${projectName.toLowerCase()}`;
    const port = variables.PORT || '8080';

    return [
      {
        relativePath: 'go.mod',
        content: `module ${modName}

go 1.22
`,
      },
      {
        relativePath: 'cmd/server/main.go',
        content: `package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type HealthResponse struct {
	Status    string    \`json:"status"\`
	Project   string    \`json:"project"\`
	Timestamp time.Time \`json:"timestamp"\`
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(HealthResponse{
			Status:    "ok",
			Project:   "${projectName}",
			Timestamp: time.Now(),
		})
	})

	log.Printf("Starting server on :${port}...")
	if err := http.ListenAndServe(":${port}", mux); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
`,
      },
    ];
  }

  if (language === 'java') {
    const groupId = variables.GROUP_ID || 'com.helix';
    const artifactId = variables.ARTIFACT_ID || projectName.toLowerCase();
    const pkgDir = groupId.replace(/\./g, '/');

    return [
      {
        relativePath: 'pom.xml',
        content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
    </parent>
    <groupId>${groupId}</groupId>
    <artifactId>${artifactId}</artifactId>
    <version>0.1.0-SNAPSHOT</version>
    <name>${projectName}</name>
    <properties>
        <java.version>21</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`,
      },
      {
        relativePath: `src/main/java/${pkgDir}/Application.java`,
        content: `package ${groupId};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@SpringBootApplication
@RestController
public class Application {

    public record HealthResponse(String status, String project, Instant timestamp) {}

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("ok", "${projectName}", Instant.now());
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
`,
      },
    ];
  }

  // Default: Python / FastAPI
  const port = variables.PORT || '8000';
  return [
    {
      relativePath: 'pyproject.toml',
      content: `[project]
name = "${projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}"
version = "0.1.0"
description = "FastAPI service created with HELIX CLI"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.111.0",
    "uvicorn>=0.30.0",
    "pydantic>=2.7.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=8.2.0",
    "ruff>=0.4.0",
    "mypy>=1.10.0"
]
`,
    },
    {
      relativePath: 'src/app/main.py',
      content: `from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime, timezone

app = FastAPI(title="${projectName}", version="0.1.0")

class HealthResponse(BaseModel):
    status: str
    project: str
    timestamp: datetime

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        project="${projectName}",
        timestamp=datetime.now(timezone.utc)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.app.main:app", host="0.0.0.0", port=${port}, reload=True)
`,
    },
  ];
}
