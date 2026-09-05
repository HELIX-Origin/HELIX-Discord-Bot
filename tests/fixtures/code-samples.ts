/**
 * Shared code samples used by plugin SDK, security, and diagnostics tests.
 */
export interface CodeSample {
  language: string;
  fileName: string;
  code: string;
}

export const codeSamples: Record<string, CodeSample> = {
  typescript: {
    language: 'typescript',
    fileName: 'src/service.ts',
    code: `export interface User {
  id: string;
  name: string;
}

export async function getUser(id: string): Promise<User | undefined> {
  const users: User[] = [];
  return users.find((u) => u.id === id);
}`,
  },
  python: {
    language: 'python',
    fileName: 'service.py',
    code: `import os

def load_config():
    value = os.getenv("CONFIG")
    if value is None:
        raise ValueError("config missing")
    return value`,
  },
  rust: {
    language: 'rust',
    fileName: 'src/main.rs',
    code: `use std::fmt;

pub struct User {
    pub id: String,
    pub name: String,
}

impl fmt::Display for User {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} ({})", self.name, self.id)
    }
}`,
  },
  go: {
    language: 'go',
    fileName: 'main.go',
    code: `package main

import (
    "fmt"
)

func main() {
    fmt.Println("hello")
}`,
  },
  java: {
    language: 'java',
    fileName: 'User.java',
    code: `public class User {
    private final String id;
    private final String name;

    public User(String id, String name) {
        this.id = id;
        this.name = name;
    }
}`,
  },
};

/** Code containing a SQL-injection-style string concatenation (SEC-001). */
export const sqlInjectionSample = `SELECT * FROM users WHERE name = ' + username`;

/** Code containing a hardcoded API key (SEC-002). */
export const hardcodedSecretSample = `const apiKey = "sk_live_9f8sd7f98s7df98s7df987";`;

/** Code containing an innerHTML assignment (SEC-003). */
export const xssSample = `document.getElementById('out').innerHTML = userInput;`;

/** Code using a weak hash (SEC-004). */
export const weakHashSample = `const hash = createHash('md5').update(password).digest('hex');`;

/** Code triggering ReDoS nesting (SEC-005). */
export const redosSample = `const re = /(a+)+b/;`;