# Agent Team Examples

Concrete examples of each architectural pattern in practice.

---

## Example 1 — Research Team (Fan-out/Fan-in, Agent Team Mode)

**Domain:** Competitive analysis / technical investigation

```
[Research Orchestrator]
  ├── [Researcher A] — investigates angle 1 (e.g., market positioning)
  ├── [Researcher B] — investigates angle 2 (e.g., technical architecture)
  ├── [Researcher C] — investigates angle 3 (e.g., pricing & business model)
  └── [Researcher D] — investigates angle 4 (e.g., user reviews & pain points)
         ↓ all write to _workspace/research/outputs/
  [Synthesizer] — merges findings, resolves conflicts
         ↓
  [Final report]
```

**Key insight:** Team mode shines here because researchers share discoveries in real-time via SendMessage. Researcher B's finding about architecture may change what A investigates about positioning. This cross-pollination is impossible with sub-agents.

**Agent template:**
```markdown
---
name: research-specialist-{domain}
description: Investigates {domain} angle of research problems. Shares findings
             with team in real-time. Trigger: research, investigate, analyze,
             competitive, rerun, deepen.
---
## Team Communication Protocol
- Writes findings to: _workspace/research/outputs/{domain}.md
- Broadcasts key discoveries via SendMessage to all team members
- Tags findings: [FINDING], [CONFLICT], [QUESTION] for easy filtering
```

---

## Example 2 — Writing Team (Pipeline + Fan-out)

**Domain:** Long-form content production (e.g., technical documentation, novel)

```
Phase 1 (Fan-out, parallel):
  [World Builder A] + [World Builder B] → establish foundations together

Phase 2 (Pipeline):
  foundations → [Prose Writer] → draft

Phase 3 (Fan-out, parallel):
  draft → [Continuity Checker] + [Style Reviewer] + [Fact Checker]

Phase 4 (Pipeline):
  review notes → [Editor] → final
```

**Key insight:** Combines patterns. Worldbuilding benefits from collaboration (team); prose writing benefits from focus (solo pipeline stage); review benefits from parallel independent perspectives.

---

## Example 3 — Validation Team (Sub-agent Mode, Producer-Reviewer)

**Domain:** Code review / output validation

```
[Producer] → generates artifact
     ↓
[Reviewer Sub-agent] → evaluates artifact
     ↓ feedback
[Producer] → revises (max 2 retries)
     ↓
[Final Validator Sub-agent] → confirms acceptance
```

**Key insight:** Sub-agent mode works here because review doesn't require the reviewer to "talk to" the producer in real-time — results pass back through the main context. Simpler and more token-efficient.

**Retry limit enforcement:**
```
retry_count = 0
while not accepted and retry_count < 3:
    feedback = reviewer.evaluate(artifact)
    if feedback.accept:
        break
    artifact = producer.revise(artifact, feedback)
    retry_count += 1
# Force accept at limit — don't loop forever
```

---

## Example 4 — Code Review Team (Fan-out with Discussion)

**Domain:** Multi-perspective code quality review

```
[Review Orchestrator]
  ├── [Security Reviewer] → checks OWASP, injection, auth
  ├── [Performance Reviewer] → checks N+1, indexes, caching
  └── [Testing Reviewer] → checks coverage, edge cases, assertions
         ↓
All three communicate directly about shared concerns
(e.g., Security: "this query is injectable" → Performance: "agreed, also N+1")
         ↓
[Report Integrator] → produces unified REVIEW.md
```

**Key insight:** Team mode is essential when reviewers should challenge each other's findings. A security issue might be performance-critical; a performance fix might introduce security risk. Cross-domain discussion catches these interactions.

**Relevant for Pet Aumigo:**
- Security agent: RLS policies, API auth, LGPD compliance
- Performance agent: Supabase query indexes, pagination, caching
- Testing agent: coverage gaps, missing edge cases

---

## Example 5 — Migration Supervisor (Dynamic Distribution)

**Domain:** Large-scale migrations, batch processing

```
[Supervisor Agent]
  → analyzes all items to process
  → creates TaskCreate entries for each batch
  → assigns batches to available workers
  [Worker A], [Worker B], [Worker C] claim tasks from shared list
  [Worker A fails on batch 7] → Supervisor reallocates to Worker C
  [All complete] → Supervisor integrates results
```

**Key insight:** Unlike static fan-out (fixed assignment upfront), Supervisor pattern handles:
- Unknown workload distribution (some batches take longer)
- Worker failures (reallocate failed batches)
- Dynamic scaling (add workers if behind schedule)

**Task claiming pattern:**
```
# Worker loop:
while True:
    task = TaskList(status='pending').next()
    if not task: break
    TaskUpdate(task.id, status='in_progress')
    result = process(task)
    TaskUpdate(task.id, status='completed', output=result)
```

---

## Pet Aumigo — Recommended Agent Team

Based on the project's planned agents (CLAUDE.md section "Agentes planejados"):

```
[Pet Aumigo Orchestrator]
  ├── [Notification Agent]    — WhatsApp alerts on new pets
  │     Pattern: Pipeline (INSERT → find volunteers → send)
  │
  ├── [Matching Agent]        — Cross-reference lost × found
  │     Pattern: Fan-out/Fan-in (query lost, query found → match)
  │
  ├── [Moderation Agent]      — Spam/duplicate detection
  │     Pattern: Producer-Reviewer (new post → analyze → approve/block)
  │
  └── [Content Agent]         — Auto-generate social posts
        Pattern: Pipeline (resolved → generate → return link)
```

**Execution mode for Pet Aumigo:** Hybrid
- Notification + Matching: Sub-agents (independent, triggered by different events)
- Moderation: Sub-agent (single decision per post)
- Content: Sub-agent (simple pipeline)
- Future: if agents need to coordinate (e.g., match found → notify AND generate content simultaneously) → upgrade to Agent Team
