# {{ project.name }} - {{ page.name }}

> {{ emoji }} **Living Source of Truth**: {{ page.description }}

> [!IMPORTANT]
> AI agents strictly required to update this page and all related pages **before** working on any new bug fixes or features and push it to the remote first, without exception. Failure to do so may result in working with outdated information and potentially introducing conflicts or redundant work. 

## 📖 Legend

### 🚦 Status

- ⚠️ **open** — reproducible, needs fixing *(Detailed lists with possible fixes encouraged. Attempt to include steps to reproduce, expected behavior, and actual behavior. An estimate of how long it might take to fix is also helpful.)*
- 🚧 **investigating** — repro/root-cause in progress *(List of issues currently being worked on. Used for tracking active work. must reference an existing bug from the open section.)*
- 🚫 **wontfix** — accepted limitations *(features that can't be fixed at this time without significant changes or trade-offs)*
- ✅ **resolved** — verified and fixed *(moved to closed with the corresponding release version or commit)*

### 🚨 Severity

- 🔴 **Critical**: *Bugs that cause crashes or major functionality loss.*
- 🟠 **High**: *Bugs that significantly impact usability but do not crash the app.*
- 🟡 **Medium**: *Bugs that affect certain features or have minor usability issues.*
- 🟢 **Low**: *Minor bugs or visual glitches that do not significantly impact the user experience.*

## 🚫 Known quirks & external limitations (wontfix bucket)

- 🐢 **External Feed Throttling & Rate Limits:** Upstream APIs (Reddit, YouTube, Twitch, GamerPower) enforce rate limits. Handlers and background workers throttle requests and implement exponential backoff rather than spam-retrying.
- **Discord API Gateway & Rate Limits:** Discord enforces global and route-specific rate limits on interaction responses, guild command syncs, and embeds. Guild command updates must be debounced.

## 💡 Explicitly not bugs

- Disabled features intentionally hide their corresponding dashboard navigation links and unregister their slash commands from Discord guilds rather than rendering disabled error embeds.

---

## {{ date }} — {{ issue.title }}

- **Severity**: {{ emoji }} {{ issue.severity }} ({{ issue.category }})
- **Status**: {{ emoji }} {{ issue.status }}
- **Reported Issue**: "{{ issue.reported }}"

###  Root Cause

{{ list.item.number }}. **{{ list.item.title }}**: {{ list.item.description }}
    - **Impact**: {{ list.item.impact }}
    - **Proposed Fix**:
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}
    - **Steps to Implement**:
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}


{{ list.item.number }}. **{{ list.item.title }}**: {{ list.item.description }}
    - **Impact**: {{ list.item.impact }}
    - **Proposed Fix**:
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}
    - **Steps to Implement**:
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}


{{ list.item.number }}. **{{ list.item.title }}**: {{ list.item.description }}
    - **Impact**: {{ list.item.impact }}
    - **Proposed Fix**:
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}
    - **Steps to Implement**:
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}
        - **{{ list.item.title }}**: {{ list.item }}

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