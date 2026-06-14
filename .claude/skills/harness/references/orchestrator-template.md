# Orchestrator Templates

Three templates for coordinating agent teams. Select based on collaboration needs.

---

## Template A — Agent Team Mode (Default)

Use when: 2+ agents need to communicate, share findings, or collaborate.

```markdown
---
name: {domain}-orchestrator
description: Orchestrates the {domain} agent team. Coordinates parallel execution,
             integrates results, handles failures. Trigger: "run {domain} pipeline",
             "orchestrate {domain}", "coordinate {domain} agents", rerun, update, improve.
---

## Core Role
Coordinate the {domain} team through 5 phases: preparation, team composition,
parallel execution, result integration, and cleanup.

## Phase 0 — Context Verification
- Check `_workspace/{domain}/` for prior session state
- If exists: resume from last checkpoint
- If new: initialize workspace structure

## Phase 1 — Preparation & Analysis
- Read input sources
- Validate prerequisites
- Write analysis to `_workspace/{domain}/context.md`

## Phase 2 — Team Composition
Using TeamCreate, assemble agents:
```
- {agent-a}: responsible for [concern A]
- {agent-b}: responsible for [concern B]
- {agent-c}: responsible for [concern C]
```

## Phase 3 — Coordinated Execution
- Dispatch agents via SendMessage with their specific inputs
- Monitor via TaskList
- Handle partial failures: mark failed tasks, continue with successful ones
- Collect outputs to `_workspace/{domain}/outputs/`

## Phase 4 — Result Integration
- Read all agent outputs from `_workspace/{domain}/outputs/`
- Resolve conflicts
- Produce final artifact at `_workspace/{domain}/final.md`

## Phase 5 — Cleanup & Report
- Archive intermediate files if needed
- Update CLAUDE.md change history
- Report summary to user

## Error Handling
- Agent timeout (>5min): log to `_workspace/{domain}/errors.md`, continue others
- Agent failure: retry once, then mark as partial and proceed
- Total failure: preserve `_workspace/` for re-entry, report what succeeded

## Team Communication Protocol
- All agents write to `_workspace/{domain}/outputs/{agent-name}.md`
- Agents signal completion via TaskUpdate (status: completed)
- Orchestrator polls TaskList every ~30s
```

---

## Template B — Sub-agent Mode (Lightweight)

Use when: inter-agent communication is unnecessary, results pass back to main.

```markdown
---
name: {domain}-runner
description: Runs parallel {domain} analysis using sub-agents. Results collected
             centrally. Trigger: "analyze {domain}", "run {domain} checks", rerun.
---

## Core Role
Spawn parallel sub-agents for {domain} concerns, collect results, integrate.

## Execution

### Parallel Dispatch
Spawn all agents simultaneously via Agent tool:
```python
# All launched in same message for true parallelism
agent_a_result = Agent(description="...", prompt="...")
agent_b_result = Agent(description="...", prompt="...")
agent_c_result = Agent(description="...", prompt="...")
```

### Result Collection
Wait for all to complete, then:
- Parse each result
- Check for errors
- Merge into unified output

### Integration
Produce final report at `_workspace/{domain}/report.md`

## Error Handling
- Sub-agent failure: note in report, continue with partial results
- Timeout: treat as empty result with error flag
```

---

## Template C — Hybrid Mode

Use when: different phases benefit from different modes.

```markdown
---
name: {domain}-hybrid-orchestrator
description: Hybrid orchestration: parallel collection via sub-agents, collaborative
             integration via team. Trigger: "full {domain} pipeline", rerun, extend.
---

## Phase A — Parallel Collection (Sub-agents)
Independent data gathering from multiple sources — no inter-agent communication needed.

```python
# Launch all collectors simultaneously
result_1 = Agent(description="Collect {source-1}", prompt="...")
result_2 = Agent(description="Collect {source-2}", prompt="...")
result_3 = Agent(description="Collect {source-3}", prompt="...")
```

Write collected data to `_workspace/{domain}/raw/`

## Phase B — Collaborative Integration (Agent Team)
Synthesis requires cross-domain discussion and conflict resolution.

```
TeamCreate with:
- synthesizer: merges all raw inputs
- validator: challenges synthesizer conclusions
- reporter: formats final output
```

Integration output: `_workspace/{domain}/integrated.md`
```

---

## Critical Principles

### 1. Declare Mode Explicitly
First line of orchestrator behavior: state whether using team or sub-agents.

### 2. Use Absolute Paths
Always `_workspace/{domain}/` as base. Never relative paths.

### 3. Preserve Context on Re-entry
```
if _workspace/{domain}/ exists:
    read prior state → continue from checkpoint
else:
    initialize fresh
```

### 4. Description Must Include Follow-up Keywords
```
"... rerun, update, improve, extend, retry, refresh"
```
This enables Claude to re-trigger the orchestrator for follow-up tasks.

### 5. Practical Error Handling
Define explicitly:
- Partial failure behavior (some agents succeed, some fail)
- Timeout policy (how long to wait)
- Re-entry behavior (resume vs restart)

---

## Data Flow Standard

```
Fan-out:
  Orchestrator → dispatches → Agent A, B, C (parallel)

Intermediate:
  Agent A → _workspace/domain/outputs/agent-a.md
  Agent B → _workspace/domain/outputs/agent-b.md
  Agent C → _workspace/domain/outputs/agent-c.md

Fan-in:
  Integrator reads all outputs → _workspace/domain/final.md

Final:
  Orchestrator reads final.md → reports to user
```
