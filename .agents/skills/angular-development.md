# Skill: Angular Development

## Overview
Architectural standards and best practices for modern Angular applications utilizing Standalone Components, Signals, inject-based Dependency Injection, and modern Angular CLI.

## Key Features
- **Standalone Components**: Eliminates `NgModule` boilerplate; components, directives, and pipes are standalone by default.
- **Signals**: Declarative reactivity model using `signal()`, `computed()`, and `effect()`.
- **New Control Flow**: `@if`, `@for`, `@switch` built directly into Angular template syntax.

## Initialization & CLI
```bash
npm install -g @angular/cli
ng new my-angular-app --standalone --routing --style=scss
cd my-angular-app
ng serve
```

## Standalone Signal Component Pattern
```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <p>Double: {{ double() }}</p>
      <button (click)="increment()">Increment</button>
    </div>
  `
})
export class CounterComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);

  increment() {
    this.count.update(c => c + 1);
  }
}
```
