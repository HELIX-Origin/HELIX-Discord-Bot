# {{ project.name }} — {{ page.title }}

> 🗺️ **Living Source of Truth**: {{ page.description }}

> [!IMPORTANT]
> AI agents strictly required to update this page and all related pages **before** working on any new bug fixes or features and push it to the remote first, without exception. Failure to do so may result in working with outdated information and potentially introducing conflicts or redundant work. 

---

## 📜 Tracking Rules

- **No Typo Duplication**: When recording user reports, clean and fix all typos to preserve professional quality.
- **Consistent Formatting**: Maintain consistent formatting and style throughout all documentation to ensure readability and professionalism.
- **Clear Sectioning**: Use clear and descriptive headers for each section to improve navigation and readability.
- **Regular Updates**: Ensure that the roadmap is regularly updated to reflect the latest developments and changes in the project.
- **Improve User Directives**: Continuously refine and clarify user directives to ensure they are easily understood and actionable.
- **Universal Direct Store Links**: Every game alert, giveaway, or deal **MUST** resolve to the actual storefront page of the game.
- **Always Track Everything**: Every new feature request, enhancement, or bug report must be logged in [`BUGS.md`](./BUGS.md), [`TODO.md`](./TODO.md), and [`ROADMAP.md`](./ROADMAP.md) before execution.

---

## {{ emoji }} Sprint {{ sprint.number }}: {{ sprint.title }}

> {{ sprint.description }}

## 📝 Tasks 

<!-- 
    ... Mermaid diagrams must be desinged with compact layout ...
    ... avoid overly complex structures and keep within sizing limits to ensure readability ...

-->

### {{ emoji }} {{ task.header }}

```mermaid
{{ task.diagram }}
```

{{ list.item.number }}. **{{ list.item.header }}**:
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
{{ list.item.number }}. **{{ list.item.header }}**:
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
{{ list.item.number }}. **{{ list.item.header }}**:
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}
    - {{ list.item.title }}: {{ list.item.description }}
        - {{ sublist.item.title }}: {{ sublist.item.description }}

---

## {{ emoji }} Sprint {{ sprint.number }}: {{ sprint.title }}

> {{ sprint.description }}

## 📝 Tasks 

<!-- 
    ... Mermaid diagrams must be desinged with compact layout ...
    ... avoid overly complex structures and keep within sizing limits to ensure readability ...

-->

### {{ emoji }} {{ task.header }}

```mermaid
{{ task.diagram }}
```

- **{{ task.title }}**: {{ task.description }}
    - **Subtasks**:
        - {{ subtask.title }}: {{ subtask.description }}
        - {{ subtask.title }}: {{ subtask.description }}
        - {{ subtask.title }}: {{ subtask.description }}

- **{{ task.title }}**: {{ task.description }}
    - **Subtasks**:
        - {{ subtask.title }}: {{ subtask.description }}
        - {{ subtask.title }}: {{ subtask.description }}
        - {{ subtask.title }}: {{ subtask.description }}

---

## 🛠️ Verification Commands

<!-- 
    ... Verification commands for the project ...
    ... must be run and pass successfully before considering the workstream complete ...
    ... failure to run these commands successfully indicates incomplete or incorrect implementation ...
    ... ensure that all dependencies are correctly installed and up-to-date ...
    ... verify that the environment is correctly configured before running the commands ...
    ... document any known issues or caveats related to the verification commands ...
    ... ensure that any required services or background processes are running before executing the verification commands ...
    ... review the output of each command carefully to identify any potential issues or warnings ...
    ... keep a record of the verification results for future reference ...
    ... update the verification commands documentation as needed to reflect any changes in the project setup ...
-->

```bash
npm run check               # typecheck + format:check + lint + tests (must pass)
npm run build               # tsc compile to dist/ (must pass)
npm test                    # vitest run
```

---

## 🔖 Metadata

<!-- 
   ... Metadata for the project ...
   ... should include project name, version, and any relevant ecosystem information ...
   ... this helps in tracking the project setup and ensuring consistency across different environments ...
   ... any additional metadata that may be relevant for project management or automation purposes ...
   ... ensure that the metadata is kept up-to-date as the project evolves ...
   ... consider including information about the project's dependencies, build tools, and runtime environment ...
   ... include any relevant information about the project's maintainers or contributors ...
   ... any other relevant project-specific metadata that may aid in project management or automation ...
   ... ensure that the metadata is easily accessible and understandable by all project stakeholders ...
   ... regularly review and update the metadata to reflect any changes in the project structure or dependencies ...
-->

- **Project**: {{ project.name }} · **version** {{ project.version }}
- **Agent Ecosystem:** [`AGENTS`](./AGENTS) and [`.agents/`](.agents/) are tracked directly in repository git tracking.