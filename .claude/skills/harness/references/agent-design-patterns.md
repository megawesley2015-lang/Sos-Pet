# Agent Design Patterns — Reference

## Execution Modes

### Agent Teams (Primary)
Teams led by a leader spawning independent Claude Code instances. Members communicate directly via `SendMessage` and self-coordinate through shared task lists (`TaskCreate`/`TaskUpdate`).

- One active team per session
- Best for: collaborative investigation, shared discoveries, real-time feedback loops
- Communication: direct SendMessage between members
- State: shared `_workspace/` files + task lists

### Sub-agents (Lightweight)
Main agent spawns sub-agents via `Agent` tool. Results return only to main context; sub-agents cannot intercommunicate.

- More token-efficient
- Best for: parallel independent tasks, expert pool routing, simple fan-out
- Communication: return values only
- State: passed via prompt, not shared

### Selection Principle
> "Agent teams are the default. Choose sub-agents only when inter-agent communication is truly unnecessary."

---

## Architectural Patterns

### 1. Pipeline
Sequential dependency — prior output feeds next input.

```
[Agent A] → output_a.md → [Agent B] → output_b.md → [Agent C]
```

**Use when:** Tasks have strict ordering, each step depends on previous results.
**Risk:** Bottleneck — one slow agent blocks all downstream.
**Mitigation:** Minimize per-stage independence; cache intermediate results.

---

### 2. Fan-out / Fan-in
Parallel analysis converging into integration. Most natural for agent teams.

```
              → [Expert A] → finding_a.md ↘
[Orchestrator] → [Expert B] → finding_b.md → [Integrator] → final.md
              → [Expert C] → finding_c.md ↗
```

**Use when:** Multiple independent angles on the same problem.
**Advantage:** Members share discoveries in real-time, improving quality vs solo investigation.
**Implementation:** Fan-out = sub-agents (parallel); Fan-in = team (collaborative integration).

---

### 3. Expert Pool
Router dynamically selects specialists based on context.

```
[Router] → analyzes input → selects [Expert X] → executes → returns result
```

**Use when:** Different input types require different specialists.
**Best suited for:** Sub-agents (no persistent team needed; router decides per request).
**Implementation:** Router agent with selection logic + pool of specialist agents.

---

### 4. Producer-Reviewer
Generation paired with validation. Real-time feedback loop in team mode.

```
[Producer] → draft → [Reviewer] → feedback → [Producer] → revised → [Reviewer] ✓
```

**Use when:** Quality requires independent validation.
**Constraint:** Implement 2–3 retry limit to prevent infinite cycles.
**Team advantage:** Reviewer can challenge producer assumptions in real-time.

---

### 5. Supervisor
Central agent dynamically distributes work based on runtime state.

```
[Supervisor] → analyzes available work → assigns to [Worker A], [Worker B]
             ← progress updates ← workers
             → reallocates based on failures/completions
```

**Use when:** Work volume or complexity is unknown upfront; dynamic allocation needed.
**Advantage over fan-out:** Reallocates on failure; handles uneven workloads.
**Implementation:** Shared task list (`TaskCreate`/`TaskUpdate`) as coordination mechanism.

---

### 6. Hierarchical Delegation
Recursive decomposition of complex tasks.

```
[L1 Orchestrator]
  ├── [L2 Team Lead A] → [Worker], [Worker]
  └── [L2 Team Lead B] → [Worker], [Worker]
```

**Use when:** Problem decomposes into distinct sub-domains, each needing a team.
**Hard constraint:** Teams cannot nest (members cannot spawn teams). Max depth: 2.
**Implementation:** L1 = team; L2 = sub-agents under each team member.

---

## Agent Definition Structure

Each agent requires `.claude/agents/{name}.md`:

```markdown
---
name: agent-name
description: [Trigger condition — specific, includes follow-up keywords]
---

## Core Role
[What this agent does and nothing else]

## Work Principles
- [Principle with rationale]

## Input Protocol
- Source, Format, Validation

## Output Protocol
- Destination, Format, Success signal

## Team Communication Protocol
- Reports to, Notifies, Shared state files

## Error Handling
- [Error type] → [recovery]
- Partial failure / Timeout behaviors
```

**All agents use `model: "claude-opus-4-8"` — never downgrade.**

---

## Agent Type Selection

| Type | Access | Best For |
|------|--------|----------|
| **Custom** | Full | Complex, multi-session, reusable roles |
| **general-purpose** | Full | Web research, general tasks, script execution |
| **Explore** | Read-only | Code analysis, safe read operations |
| **Plan** | Read-only | Design, planning, no code modifications |

**Principle:** Always define agents as custom types in `.claude/agents/` for reusability and explicit team protocols, even if wrapping built-in capabilities.

---

## Skills vs Agents

| Concept | Location | Purpose |
|---------|----------|---------|
| **Skills** | `.claude/skills/` | Procedural knowledge — "how to do X" |
| **Agents** | `.claude/agents/` | Expert personas — "who does X, under what principles" |

Agents reference skills via:
1. `Skill` tool call (standard)
2. Inline embedding (small, agent-specific procedures)
3. Reference loading (large, conditional — load only when needed)

---

## Reuse Guidelines

Before creating a new agent:
1. Check `.claude/agents/` for overlap
2. Can an existing agent be extended? → prefer extension
3. Separate when: domains differ, parallel execution is possible, context burden is high, reuse across teams is planned
4. Consolidate when: roles overlap within one team, single concern

**Deduplication rule:** When extending existing agents, verify all dependent orchestrators remain functional after changes.
