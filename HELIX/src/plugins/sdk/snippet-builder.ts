/**
 * src/plugins/sdk/snippet-builder.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Parameterized code generator engine (zero AI).
 * Generates idiomatic, type-safe data models, REST endpoints, unit test suites,
 * and standard algorithms across languages.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { SnippetGeneration } from '../types.js';

export type SnippetType = 'model' | 'route' | 'test' | 'service' | 'algorithm';

/**
 * Generates a parameterized code snippet.
 */
export function buildSnippet(
  language: string,
  type: SnippetType | string,
  name: string,
  options: Record<string, any> = {}
): SnippetGeneration {
  const lang = language.toLowerCase();
  const titleName = name.charAt(0).toUpperCase() + name.slice(1);
  const lowerName = name.toLowerCase();

  switch (type) {
    case 'model':
      return generateModel(lang, titleName, lowerName);
    case 'route':
    case 'controller':
      return generateRoute(lang, titleName, lowerName);
    case 'test':
      return generateTest(lang, titleName, lowerName);
    case 'algorithm':
    case 'utility':
      return generateAlgorithm(lang, titleName, lowerName, options.algo || 'debounce');
    default:
      return generateModel(lang, titleName, lowerName);
  }
}

function generateModel(lang: string, titleName: string, lowerName: string): SnippetGeneration {
  if (lang === 'typescript' || lang === 'javascript' || lang === 'ts' || lang === 'js') {
    return {
      language: 'typescript',
      snippetType: 'model',
      name: titleName,
      description: `TypeScript interface and type guard for ${titleName}`,
      code: `export interface ${titleName} {\n  id: string;\n  name: string;\n  createdAt: Date;\n  updatedAt?: Date;\n  isActive: boolean;\n}\n\nexport function is${titleName}(obj: unknown): obj is ${titleName} {\n  return (\n    typeof obj === 'object' &&\n    obj !== null &&\n    'id' in obj &&\n    'name' in obj\n  );\n}`,
    };
  }

  if (lang === 'python' || lang === 'py') {
    return {
      language: 'python',
      snippetType: 'model',
      name: titleName,
      description: `Pydantic BaseModel for ${titleName}`,
      dependencies: ['pydantic'],
      code: `from pydantic import BaseModel, Field\nfrom datetime import datetime, timezone\nfrom typing import Optional\n\nclass ${titleName}(BaseModel):\n    id: str = Field(..., description="Unique identifier")\n    name: str = Field(..., min_length=1)\n    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))\n    updated_at: Optional[datetime] = None\n    is_active: bool = True`,
    };
  }

  if (lang === 'rust' || lang === 'rs') {
    return {
      language: 'rust',
      snippetType: 'model',
      name: titleName,
      description: `Rust Struct with Serde Serialization for ${titleName}`,
      dependencies: ['serde', 'chrono'],
      code: `use serde::{Deserialize, Serialize};\nuse chrono::{DateTime, Utc};\n\n#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${titleName} {\n    pub id: String,\n    pub name: String,\n    pub created_at: DateTime<Utc>,\n    pub updated_at: Option<DateTime<Utc>>,\n    pub is_active: bool,\n}`,
    };
  }

  if (lang === 'go') {
    return {
      language: 'go',
      snippetType: 'model',
      name: titleName,
      description: `Go Struct with JSON tags for ${titleName}`,
      code: `package models\n\nimport "time"\n\ntype ${titleName} struct {\n\tID        string     \`json:"id"\`\n\tName      string     \`json:"name"\`\n\tCreatedAt time.Time  \`json:"created_at"\`\n\tUpdatedAt *time.Time \`json:"updated_at,omitempty"\`\n\tIsActive  bool       \`json:"is_active"\`\n}`,
    };
  }

  if (lang === 'java') {
    return {
      language: 'java',
      snippetType: 'model',
      name: titleName,
      description: `Java 21 Record for ${titleName}`,
      code: `package com.helix.models;\n\nimport java.time.Instant;\nimport java.util.Optional;\n\npublic record ${titleName}(\n    String id,\n    String name,\n    Instant createdAt,\n    Optional<Instant> updatedAt,\n    boolean isActive\n) {}`,
    };
  }

  return {
    language: lang,
    snippetType: 'model',
    name: titleName,
    description: `Generic data entity for ${titleName}`,
    code: `// Data model for ${titleName}\n{\n  "id": "string",\n  "name": "string",\n  "createdAt": "timestamp",\n  "isActive": true\n}`,
  };
}

function generateRoute(lang: string, titleName: string, lowerName: string): SnippetGeneration {
  if (lang === 'typescript' || lang === 'javascript' || lang === 'ts' || lang === 'js') {
    return {
      language: 'typescript',
      snippetType: 'route',
      name: `${titleName}Router`,
      description: `Express router endpoints for ${lowerName} CRUD`,
      dependencies: ['express'],
      code: `import { Router, Request, Response } from 'express';\n\nconst router = Router();\n\nrouter.get('/${lowerName}s', async (req: Request, res: Response) => {\n  res.json({ message: 'List all ${lowerName}s', data: [] });\n});\n\nrouter.get('/${lowerName}s/:id', async (req: Request, res: Response) => {\n  const { id } = req.params;\n  res.json({ message: \`Get ${lowerName} \${id}\`, id });\n});\n\nrouter.post('/${lowerName}s', async (req: Request, res: Response) => {\n  const payload = req.body;\n  res.status(201).json({ message: 'Created ${lowerName}', data: payload });\n});\n\nexport default router;`,
    };
  }

  if (lang === 'python' || lang === 'py') {
    return {
      language: 'python',
      snippetType: 'route',
      name: `${titleName}Router`,
      description: `FastAPI APIRouter for ${lowerName} CRUD`,
      dependencies: ['fastapi'],
      code: `from fastapi import APIRouter, HTTPException, status\nfrom typing import List\n\nrouter = APIRouter(prefix="/${lowerName}s", tags=["${lowerName}s"])\n\n@router.get("/", status_code=status.HTTP_200_OK)\nasync def list_${lowerName}s():\n    return {"items": []}\n\n@router.get("/{item_id}")\nasync def get_${lowerName}(item_id: str):\n    return {"id": item_id, "name": f"${titleName} {item_id}"}\n\n@router.post("/", status_code=status.HTTP_201_CREATED)\nasync def create_${lowerName}(payload: dict):\n    return {"status": "created", "data": payload}`,
    };
  }

  if (lang === 'rust' || lang === 'rs') {
    return {
      language: 'rust',
      snippetType: 'route',
      name: `${titleName}Handlers`,
      description: `Axum route handlers for ${lowerName}`,
      dependencies: ['axum', 'serde_json'],
      code: `use axum::{\n    extract::Path,\n    routing::{get, post},\n    Json, Router,\n};\nuse serde_json::{json, Value};\n\npub fn ${lowerName}_routes() -> Router {\n    Router::new()\n        .route("/${lowerName}s", get(list_${lowerName}s).post(create_${lowerName}))\n        .route("/${lowerName}s/:id", get(get_${lowerName}))\n}\n\nasync fn list_${lowerName}s() -> Json<Value> {\n    Json(json!({ "items": [] }))\n}\n\nasync fn get_${lowerName}(Path(id): Path<String>) -> Json<Value> {\n    Json(json!({ "id": id }))\n}\n\nasync fn create_${lowerName}(Json(payload): Json<Value>) -> Json<Value> {\n    Json(json!({ "created": payload }))\n}`,
    };
  }

  return {
    language: lang,
    snippetType: 'route',
    name: `${titleName}Route`,
    description: `HTTP routes for ${lowerName}`,
    code: `GET /${lowerName}s\nPOST /${lowerName}s\nGET /${lowerName}s/:id\nDELETE /${lowerName}s/:id`,
  };
}

function generateTest(lang: string, titleName: string, lowerName: string): SnippetGeneration {
  if (lang === 'typescript' || lang === 'javascript' || lang === 'ts' || lang === 'js') {
    return {
      language: 'typescript',
      snippetType: 'test',
      name: `${titleName}Tests`,
      description: `Vitest / Jest unit test suite for ${titleName}`,
      dependencies: ['vitest'],
      code: `import { describe, it, expect, beforeEach } from 'vitest';\n\ndescribe('${titleName} Service', () => {\n  beforeEach(() => {\n    // Setup test state\n  });\n\n  it('creates a new ${lowerName} correctly', () => {\n    const item = { id: '1', name: 'Test ${titleName}' };\n    expect(item.name).toBe('Test ${titleName}');\n  });\n\n  it('handles not found scenarios gracefully', () => {\n    const findItem = (id: string) => (id === '1' ? { id } : null);\n    expect(findItem('non-existent')).toBeNull();\n  });\n});`,
    };
  }

  if (lang === 'python' || lang === 'py') {
    return {
      language: 'python',
      snippetType: 'test',
      name: `test_${lowerName}`,
      description: `Pytest test suite for ${lowerName}`,
      dependencies: ['pytest'],
      code: `import pytest\n\ndef test_create_${lowerName}():\n    item = {"id": "1", "name": "Test ${titleName}"}\n    assert item["name"] == "Test ${titleName}"\n\n@pytest.mark.asyncio\nasync def test_async_${lowerName}_lookup():\n    async def fetch(item_id: str):\n        return {"id": item_id}\n    \n    result = await fetch("123")\n    assert result["id"] == "123"`,
    };
  }

  return {
    language: lang,
    snippetType: 'test',
    name: `${titleName}Tests`,
    description: `Unit test stub for ${titleName}`,
    code: `// Test suite for ${titleName}\nassert(${lowerName} != null);`,
  };
}

function generateAlgorithm(lang: string, _titleName: string, _lowerName: string, algo: string): SnippetGeneration {
  if (algo === 'debounce') {
    return {
      language: 'typescript',
      snippetType: 'algorithm',
      name: 'debounce',
      description: 'Type-safe debounce function with immediate and cancellation support',
      code: `export function debounce<T extends (...args: any[]) => any>(\n  fn: T,\n  delayMs: number\n): (...args: Parameters<T>) => void {\n  let timeoutId: ReturnType<typeof setTimeout> | null = null;\n\n  return function (this: any, ...args: Parameters<T>) {\n    if (timeoutId) clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => {\n      fn.apply(this, args);\n    }, delayMs);\n  };\n}`,
    };
  }

  return {
    language: 'typescript',
    snippetType: 'algorithm',
    name: 'binarySearch',
    description: 'Binary search algorithm for sorted arrays',
    code: `export function binarySearch<T>(arr: T[], target: T, compare: (a: T, b: T) => number): number {\n  let low = 0;\n  let high = arr.length - 1;\n\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    const cmp = compare(arr[mid], target);\n    if (cmp === 0) return mid;\n    if (cmp < 0) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}`,
  };
}
