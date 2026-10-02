# {{ project.name }} — Task Checklist & Workstream Tracking

> 📋 **Living Source of Truth**: {{ page.description }}

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

## 🔥 Active Workstreams

<!--
    ... Active implementation workstreams currently being executed ...
    ... Must always be placed at the top above upcoming and completed workstreams ...
-->

### {{ emoji }} Workstream W.{{N}}: {{ workstream.title }}

```mermaid
{{ workstream.diagram }}
```

{{ workstream.description }}

**Locked user directives:**

<!-- 
    ... this section must be kept properly formatted to ensure clarity and readability ...
    ... use a better formatting and wording to enhance readability and comprehension ...
    ... the user may not always word things clearly or consistently ...
    ... ensure that any important details or context are not overlooked ...
    ... provide examples or clarifications if necessary to aid understanding ...
-->

- "{{ user.directive }}"

**Implementation checklist:**

<!--
    ... Implementation checklist should be kept up-to-date with the latest tasks and sub-tasks ...
    ... ensure that each item is clearly defined and actionable ...
    ... break down complex tasks into smaller, manageable sub-tasks ...
-->

- [ ] {{ list.item }}
    - [ ] {{ sublist.item }}
    - [ ] {{ sublist.item }}
- [ ] {{ list.item }}
    - [ ] {{ sublist.item }}
    - [ ] {{ sublist.item }}

---

## 📋 Upcoming Workstreams

<!--
    ... Upcoming workstreams planned for near-term implementation ...
-->

### {{ emoji }} Workstream W.{{N}}: {{ workstream.title }}

```mermaid
{{ workstream.diagram }}
```

{{ workstream.description }}

**Locked user directives:**

- "{{ user.directive }}"

**Implementation checklist:**

- [ ] {{ list.item }}
    - [ ] {{ sublist.item }}
    - [ ] {{ sublist.item }}

---

## ✅ Completed Workstreams

<!--
    ... Completed implementation workstreams with full task checklists and delivery history ...
-->

### ✅ Workstream W.{{N}}: {{ workstream.title }}

**Locked user directives:**

- "{{ user.directive }}"

**Implementation checklist:**

- [x] {{ list.item }}
- [x] {{ list.item }}

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