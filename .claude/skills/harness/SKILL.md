# Harness — Agent Team & Skill Architect
# Meta-skill: designs domain-specific agent teams and generates specialized agents/skills
# Version: 1.2.0 | Source: github.com/revfactory/harness | License: Apache 2.0

## When to Use
Use this skill when the user says:
- "Build a harness for this project"
- "Create an agent team for [domain]"
- "Design agents for [task]"
- "Set up a harness", "generate agent architecture", "create team structure"
- "Add agents to the project", "organize agents", "orchestrate agents"

Also trigger when: user describes a complex multi-step workflow, needs parallelization, or asks to automate a domain with multiple concerns.

## Core Principles

1. **Agent definitions live in `.claude/agents/{name}.md`** — one file per agent, always
2. **Skills live in `.claude/skills/{name}.skill`** — procedural knowledge, not personas
3. **Agent teams are the default** — sub-agents only when inter-agent communication is unnecessary
4. **All agents use `model: "claude-opus-4-8"`** — never downgrade
5. **Register in CLAUDE.md** — harness is an evolving system; document triggers and change history
6. **Agents reference skills** — agents are WHO, skills are HOW

---

## Workflow (8 Phases)

### Phase 0 — Audit Current State
Before creating anything:
```
- Check .claude/agents/ for existing agents
- Check .claude/skills/ for existing skills
- Read CLAUDE.md for registered harness entries
- Identify reuse opportunities (never duplicate)
```

### Phase 1 — Domain Analysis
Understand the problem space:
```
- What is the core domain? (e.g., notifications, matching, moderation)
- What are the distinct concerns? (each → candidate agent)
- What data flows? (inputs/outputs between agents)
- What triggers exist? (events, schedules, user actions)
- What are the failure modes?
```

### Phase 2 — Team Architecture Design

**Select execution mode:**

| Mode | When to use |
|------|-------------|
| **Agent Teams** | 2+ agents need to communicate, share findings, collaborate |
| **Sub-agents** | Parallel independent tasks, results return to main only |
| **Hybrid** | Phase A = sub-agents (parallel collection), Phase B = team (integration) |

**Select architectural pattern** (see `references/agent-design-patterns.md`):
- **Pipeline** — sequential dependency, output feeds next
- **Fan-out/Fan-in** — parallel analysis, converge to integration
- **Expert Pool** — router selects specialist by context
- **Producer-Reviewer** — generate + validate pair, max 3 retries
- **Supervisor** — central agent distributes tasks dynamically
- **Hierarchical Delegation** — recursive decomposition, max depth 2

### Phase 3 — Agent Definition Generation

**Deduplication check first:**
```
- Does an existing agent cover this role? → extend it instead
- Is there partial overlap? → split responsibilities cleanly
- Are all dependents still functional after changes?
```

**For each agent, create `.claude/agents/{name}.md`:**
```markdown
---
name: agent-name
description: [TRIGGER CONDITION — be specific. What exact situation activates this agent?
             Include follow-up keywords: rerun, update, improve, extend]
---

## Core Role
[Precise description of what this agent does and nothing else]

## Work Principles
- [Principle 1 — why, not just what]
- [Principle 2]

## Input Protocol
- Source: [where input comes from]
- Format: [exact structure expected]
- Validation: [how to verify input is valid]

## Output Protocol
- Destination: [where output goes]
- Format: [exact structure produced]
- Success signal: [how caller knows it succeeded]

## Team Communication Protocol
- Reports to: [orchestrator or parent agent]
- Notifies: [which agents receive updates]
- Shared state: [_workspace/ files used]

## Error Handling
- [Error type] → [recovery action]
- Partial failure: [what to preserve, what to retry]
- Timeout: [fallback behavior]
```

### Phase 4 — Skill Creation

**Deduplication check first** (same as Phase 3).

**Skill files go in `.claude/skills/{name}.skill`:**
```markdown
# Skill: {name}
## When to Use
[Specific trigger conditions — overshoot slightly to compensate for Claude's conservative activation]

## Workflow
[Step-by-step procedure — principle-based, not rigid rules]

## Output Format
[Template with concrete example]

## Verification
[How to confirm skill executed correctly]
```

**SKILL.md body limit: 500 lines** — excess content moves to `references/`.

### Phase 5 — Integration & Orchestration

Create orchestrator agent or skill:
- See `references/orchestrator-template.md` for templates A, B, C
- Use `_workspace/` for shared state between agents
- Define data flow: fan-out → intermediate files → fan-in → integration
- Team sizing: 3–7 agents optimal; beyond 7 creates coordination overhead
- Register in CLAUDE.md: triggers + change history only (no full agent/skill lists)

### Phase 6 — Validation & Testing

**Structure validation:**
```
✓ .claude/agents/{name}.md exists for every agent
✓ .claude/skills/{name}.skill exists for every skill
✓ All agents reference `model: "claude-opus-4-8"`
✓ Descriptions are "pushy" with follow-up keywords
✓ CLAUDE.md updated with harness section
```

**Execution validation:**
```
✓ Execution mode declared explicitly
✓ Team mode: TeamCreate + SendMessage wired
✓ Sub-agent mode: Agent tool with correct parameters
✓ Orchestrator handles partial failures
```

**Dry-run test scenarios:**
```
- Happy path: normal input, expected output
- Edge case: missing data, empty input
- Failure: one agent fails, rest continue
- Re-entry: harness called a second time (no duplicates created)
```

See `references/skill-testing-guide.md` for assertion-based scoring methodology.

### Phase 7 — QA Boundary Check

Before declaring complete, the QA agent verifies 6 boundary mismatch patterns:
1. API response shape ↔ frontend hook types
2. Field naming: camelCase vs snake_case
3. File paths ↔ URL segments in links/router
4. State transition maps ↔ actual status update code
5. Endpoint exists ↔ actually called from hooks
6. Sync vs async response shapes

See `references/qa-agent-guide.md` for full checklist.

### Phase 8 — Harness Evolution

After deployment:
- Collect feedback on which agents trigger too often / too rarely
- Adjust descriptions at principle level (not specific case fixes)
- Log change history in CLAUDE.md harness section
- Run re-validation after any agent definition change

---

## Deliverables Checklist

```
[ ] .claude/agents/ directory exists
[ ] One .md file per agent with full frontmatter + sections
[ ] .claude/skills/ files for all domain skills
[ ] Orchestrator agent or skill created
[ ] Execution mode explicitly declared
[ ] _workspace/ pattern defined for shared state
[ ] Error handling documented per agent
[ ] CLAUDE.md updated (triggers + change history only)
[ ] Dry-run scenarios written
[ ] QA boundary check completed
[ ] No duplicate agents or skills
[ ] All models set to claude-opus-4-8
[ ] Descriptions include follow-up keywords
[ ] Skill bodies under 500 lines
[ ] References in references/ for large content
```

---

## References
- [Agent Design Patterns](references/agent-design-patterns.md)
- [Orchestrator Templates](references/orchestrator-template.md)
- [Team Examples](references/team-examples.md)
- [Skill Writing Guide](references/skill-writing-guide.md)
- [Skill Testing Guide](references/skill-testing-guide.md)
- [QA Agent Guide](references/qa-agent-guide.md)
