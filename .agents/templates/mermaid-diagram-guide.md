# Mermaid Diagram Formatting Standard & Template Guide

## Purpose
This guide defines mandatory syntax rules and standardized templates for generating Mermaid diagrams in HELIX documentation, architecture plans, and agent artifacts. Following these rules prevents rendering crashes, parser failures, and corrupted diagrams across GitHub, Antigravity, and documentation viewers.

---

## 1. Golden Rules for Syntax Safety

### Rule 1: Always Double-Quote Labels with Special Characters
If a node label contains parentheses `()`, brackets `[]`, braces `{}`, colons `:`, slashes `/`, commas `,`, ampersands `&`, or punctuation, **ALWAYS** enclose the text in double quotes inside the bracket syntax:

```mermaid
%% CORRECT
flowchart TD
    A["User Input (>lint)"] --> B["Router: CommandDefinition"]
    B --> C["AST Parser (TypeScript / Python)"]
    C --> D["Result: { status: 'ok' }"]
```

```mermaid
%% INCORRECT - WILL CRASH PARSER
%% A[User Input (>lint)] --> B[Router: CommandDefinition]
```

### Rule 2: Use Safe Alphanumeric Node Identifiers
- Keep node IDs simple: `A`, `B`, `node_1`, `clientGateway`, `authFlow`.
- **Never** put spaces, colons, dashes, or special characters in the node ID itself.
  - Right: `step1["Step 1: Parse Arguments"]`
  - Wrong: `step 1: parse["Step 1: Parse Arguments"]`

### Rule 3: Quote Subgraph Names with Special Characters
When naming subgraphs, if the title has spaces or punctuation, enclose it in quotes or assign a clean identifier:
```mermaid
flowchart TD
    subgraph CoreEngine ["HELIX Core Engine (In-Process)"]
        nodeA["Plugin Registry"]
        nodeB["Message Formatter"]
    end
```

### Rule 4: Escape Quotes Inside Labels
If a label must include quotes, use the `#quot;` entity:
```mermaid
flowchart LR
    A["Command: #quot;>set prefix !#quot;"] --> B["Saved to SQLite"]
```

---

## 2. Standardized Templates

### Template A: Architecture Flowchart (`flowchart TD` / `flowchart LR`)
Use for system dataflow, routing, and lifecycle pipelines:

```mermaid
flowchart TD
    User["Discord User"] -->|Slash or Prefix| Gateway["Discord Gateway"]
    Gateway --> Client["HELIX Client (HelixBotClient)"]
    
    subgraph Handlers ["Event & Command Pipeline"]
        Client --> CmdHandler["Command Handler"]
        CmdHandler --> Validator["Permission & Option Validator"]
        Validator --> Exec["CommandDefinition.execute()"]
    end

    subgraph Intelligence ["Language Intelligence Engine"]
        Exec --> Router["Plugin Router"]
        Router --> PluginRegistry["Plugin Registry"]
        PluginRegistry --> LocalPlugin["Built-in Language Plugin"]
        LocalPlugin --> AST["AST Linter / Doc Parser"]
    end

    subgraph Output ["Formatting & Delivery"]
        AST --> MsgHandler["Message Handler (messages.json)"]
        MsgHandler --> Embed["EmbedBuilder (Custom Color & Schema)"]
        Embed --> UserReply["Discord Channel Reply"]
    end
```

---

### Template B: Decision & Triage Flowchart
Use for conditional logic, authorization checks, and validation paths:

```mermaid
flowchart TD
    Start(["Command Invocation"]) --> CheckPerm{"Has Required Permissions?"}
    
    CheckPerm -->|"No"| Denied["formatError('permission_denied')"]
    Denied --> ReplyFail["Reply with Error Embed"]
    
    CheckPerm -->|"Yes"| CheckArgs{"Valid Arguments?"}
    CheckArgs -->|"No"| BadArgs["formatError('invalid_argument')"]
    BadArgs --> ReplyFail
    
    CheckArgs -->|"Yes"| RunTask["Execute Business Logic"]
    RunTask --> FormatResult["createEmbed('category.action.embed')"]
    FormatResult --> ReplySuccess["Reply with Styled Embed"]
```

---

### Template C: Interaction Sequence Diagram (`sequenceDiagram`)
Use for multi-party protocol flows (e.g. Ticket creation, OAuth2 authentication):

```mermaid
sequenceDiagram
    autonumber
    actor User as Discord User
    participant Bot as HELIX Bot
    participant DB as SQLite Singleton
    participant Thread as Ticket Thread

    User->>Bot: Click "Create Ticket" Button
    Bot->>User: Display Modal (Subject, Details)
    User->>Bot: Submit Modal Interaction
    Bot->>DB: Check Existing Active Tickets
    alt User Has Active Ticket
        Bot-->>User: Ephemeral Error Notice
    else No Active Ticket
        Bot->>Thread: Create Private Thread (10080 auto-archive)
        Bot->>Thread: Add User & Ticket Manager Role
        Bot->>DB: Record Ticket (threadId, userId, subject)
        Bot->>Thread: Send createEmbed('config.ticket.welcome_embed')
        Bot-->>User: Ephemeral Success with Thread Link
    end
```

---

### Template D: State Machine Diagram (`stateDiagram-v2`)
Use for ticket lifecycles, plugin loading states, and job processing:

```mermaid
stateDiagram-v2
    [*] --> Unloaded : Initial Boot
    Unloaded --> Discovered : Read config.json
    Discovered --> Validated : Verify plugin.json
    Validated --> Enabled : Load Module & Register
    
    Enabled --> Disabled : >plugin disable <id>
    Disabled --> Enabled : >plugin enable <id>
    
    Enabled --> Unregistered : >plugin remove <id>
    Disabled --> Unregistered : >plugin remove <id>
    Unregistered --> [*] : Directory Cleaned
```

---

### Template E: Roadmap & Milestone Pipeline (`flowchart TD` / `flowchart LR`)
Use for project roadmaps, phase tracking, and milestone progressions (Note: `gantt` is unsupported by markdown parsers):

```mermaid
flowchart TD
    subgraph Foundation ["Core Infrastructure"]
        P1["Phase 1: Architecture & Agent Ecosystem ✅"]
        P2["Phase 2: TypeScript CLI & Scaffolding Engine ✅"]
        P3["Phase 3: Multi-Framework Templates & Generators ✅"]
    end

    subgraph Integration ["Platform & Bot Transition"]
        P4["Phase 4: Code Hosting Platform Integrations ✅"]
        P5["Phase 5: Testing Suite & Verification ✅"]
        P6["Phase 6: Packaging & Docker Release ✅"]
        P7["Phase 7: Discord Bot Architecture ✅"]
    end

    subgraph Ecosystem ["Plugin Ecosystem & SDK"]
        P8["Phase 8: Language Plugin System ✅"]
        P9["Phase 9: Plugin Template Repository & SDK 🔄"]
    end

    P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9
```

---

## 3. Supported Mermaid Diagram Types

| Diagram Type | Header Identifier | Supported | Notes |
|--------------|-------------------|-----------|-------|
| Flowchart / Graph | `flowchart TD`, `flowchart LR`, `graph TD` | **Yes** | Primary choice for architecture, roadmaps, and triage |
| State Diagram | `stateDiagram-v2` | **Yes** | Use for entity and lifecycle states |
| Sequence Diagram | `sequenceDiagram` | **Yes** | Use for event, OAuth2, and command flows |
| Class Diagram | `classDiagram` | **Yes** | Use for object hierarchies and models |
| Entity Relationship | `erDiagram` | **Yes** | Use for database schemas |
| XY Chart | `xychart-beta` | **Yes** | Use for numeric data & metric charts |
| Gantt Chart | `gantt` | **NO** | ❌ Causes parser error in IDE and markdown renderers |

