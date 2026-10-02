# {{ project.name }} — {{ page.title }}

> 🗺️ **Living Source of Truth**: {{ page.description }}

> [!IMPORTANT]
> AI agents strictly required to update this page and all related pages **before** working on any new bug fixes or features and push it to the remote first, without exception. Failure to do so may result in working with outdated information and potentially introducing conflicts or redundant work. 

---

## 📜 Tracking Rules

- **No Typo Duplication**: When recording user reports, clean and fix all typos to preserve professional quality.
- **Consistent Formatting**: Maintain consistent formatting and style throughout all documentation to ensure readability and professionalism.
- **Clear Sectioning**: Use clear and descriptive headers for each section to improve navigation and readability.
- **Active Items First**: The currently active milestone, sprint, task, or workstream must always be placed at the top of the content sections.
- **Regular Updates**: Ensure that the roadmap is regularly updated to reflect the latest developments and changes in the project.
- **Improve User Directives**: Continuously refine and clarify user directives to ensure they are easily understood and actionable.
- **Universal Direct Store Links**: Every game alert, giveaway, or deal **MUST** resolve to the actual storefront page of the game.
- **Always Track Everything**: Every new feature request, enhancement, or bug report must be logged in [`BUGS.md`](./BUGS.md), [`TODO.md`](./TODO.md), and [`ROADMAP.md`](./ROADMAP.md) before execution.

---

## 🎯 Active Sprints

<!--
    ... Active sprints currently being executed ...
    ... Must always be placed at the top above completed sprints ...
-->

### {{ emoji }} Sprint {{ sprint.number }}: {{ sprint.title }}

> {{ sprint.description }}

#### 📝 Tasks 

```mermaid
{{ task.diagram }}
```

1. **{{ list.item.header }}**:
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
2. **{{ list.item.header }}**:
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}

---

## ✅ Completed Sprints

<!--
    ... Completed sprints with verified deliverables and release milestones ...
-->

### {{ emoji }} Sprint {{ sprint.number }}: {{ sprint.title }}

- {{ list.item }}
- {{ list.item }}

---

## 🛠️ Verification Commands

```bash
npm run check               # typecheck + format:check + lint + tests (must pass)
npm run build               # tsc compile to dist/ (must pass)
npm test                    # vitest run
```

---

## 🔖 Metadata

- **Project**: {{ project.name }} · **version** {{ project.version }}
- **Agent Ecosystem:** [`AGENTS`](./AGENTS) and [`.agents/`](.agents/) are tracked directly in repository git tracking.