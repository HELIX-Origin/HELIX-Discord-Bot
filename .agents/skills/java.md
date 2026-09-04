# Skill: Java & Spring Boot Development

## Overview
Guidelines and standards for enterprise microservices and backend applications built with Java 21 LTS and Spring Boot 3+.

## Architectural Principles
- **Java 21 Features**: Leverage record classes for immutable DTOs, pattern matching for `switch`, and Virtual Threads (Project Loom) for high-throughput concurrency.
- **Dependency Injection**: Use explicit constructor injection with `final` fields (avoid field `@Autowired`).
- **Data Persistence**: Spring Data JPA with Flyway/Liquibase database migrations.

## Spring Boot Controller Pattern
```java
package com.helix.service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    public record HealthStatus(String status, Instant timestamp) {}

    @GetMapping("/health")
    public ResponseEntity<HealthStatus> checkHealth() {
        return ResponseEntity.ok(new HealthStatus("UP", Instant.now()));
    }
}
```

## Maven Automation Commands
```bash
# Compile and run tests
./mvnw clean test

# Run application locally
./mvnw spring-boot:run

# Package executable JAR
./mvnw clean package -DskipTests
```
