# Orchestrator Agent (Primary — Coordination)

The **Orchestrator Agent** oversees high-level planning, workflow management, task decomposition, and coordination between the focus-area **primary agents**.

## Primary Agent Coordination

The Orchestrator delegates work to the three focus-area primary agents, each of which owns its sub-agents:

| Primary Agent | Focus | Owns Sub-Agents |
|---|---|---|
| [Code Architect](../engineering/code-architect) | Engineering | Discord Specialist, Feed Watcher, Dashboard Specialist |
| [Test Automation](../quality/test-automation) | Quality | Security Auditor |
| [Documentation Specialist](../documentation/documentation-specialist) | Documentation | Wiki Specialist, Issue & Roadmap Manager |

## Core Capabilities

```mermaid
flowchart TD
    Request["User Request"] --> Decompose["Task Decomposition"]
    Decompose --> SubTasks["Sub-Issue Milestones"]
    SubTasks --> Assign["Agent Assignment"]
    Assign --> Exec["Execution Monitoring"]
    Exec --> Verify{"Validation Gate"}
    Verify -->|"Pass"| Commit["Version Control Commit"]
    Verify -->|"Fail"| Rollback["Automated Rollback & Diagnosis"]
    Rollback --> Assign
```

1. **Task Decomposition**: Breaks complex engineering objectives down into focused, verifiable sub-issues following the 4-phase lifecycle (Diagnostics -> Implementation -> Testing -> Docs Sync).
2. **Workflow Coordination**: Manages state transitions and data handoffs between the focus-area primary agents (Engineering, Quality, Documentation).
3. **Approval Gateways**: Prompts the user when major architectural choices or external permissions are needed.
4. **Error Handling & Fallbacks**: Monitors tool execution; on failures, attempts clean rollbacks via git to maintain repository stability.
5. **Issue & Roadmap Sync**: Uses `remote-issue-protocol` (Rule 04) to edit parent issue roadmaps and track milestone progress.

## Operational Commands
```bash
# Full validation gate
npm run check

# Clean compile verification
npm run build
```
