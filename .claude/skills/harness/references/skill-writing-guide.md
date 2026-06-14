# Skill Writing Guide

8 principles for writing skills that Claude actually activates and executes correctly.

---

## 1. Description — The Only Activation Mechanism

The `description` field in a skill's frontmatter is the **only signal Claude uses to decide whether to activate a skill**. Write it to be specific, include edge conditions, and err slightly on the pushy side — Claude is conservative by default.

**Bad description:**
```
description: Helps with code review tasks
```

**Good description:**
```
description: Reviews code for bugs, security issues, and performance problems.
             Use when: asked to review a PR, check code quality, audit a file,
             or validate an implementation. Also triggers on: "look at this code",
             "anything wrong here?", "is this secure?". Rerun, improve, extend.
```

**Rules:**
- Name specific trigger situations
- Include near-miss exclusions ("NOT for: general questions about code")
- Add follow-up keywords: rerun, update, improve, extend, retry, refresh
- Compensate for Claude's conservative judgment — be slightly over-inclusive

---

## 2. Body Style — Principles Over Rules

Principle-based instructions are more robust than rigid rules.

**Rigid rule (fragile):**
```
If the file has more than 200 lines, summarize the first 50.
```

**Principle (robust):**
```
Manage context efficiently — for large files, load only the sections relevant
to the current concern rather than reading everything.
```

When updating based on feedback:
- Generalize to the underlying principle, not the specific case
- Ask: "what rule would have prevented this?" → write that rule

Use imperative tone. Be concise. Every word costs context.

---

## 3. Output Format — Templates with Examples

For skills where output format matters, provide a template AND a concrete example.

```markdown
## Output Format

Template:
```
## Finding: {title}
**Severity:** {critical|high|medium|low}
**Location:** {file}:{line}
**Issue:** {one-sentence description}
**Fix:** {concrete action}
```

Example:
```
## Finding: SQL Injection in search endpoint
**Severity:** critical
**Location:** app/api/search/route.ts:47
**Issue:** User input passed directly to query without sanitization
**Fix:** Use parameterized queries via supabase.rpc() or .filter()
```
```

---

## 4. Examples Over Explanations

Input/output examples communicate faster than long explanations.

**Instead of:**
> "The skill should analyze the input, identify patterns, and produce structured output that captures the key findings in a format suitable for downstream processing."

**Write:**
```
Input: "Review this Supabase query for security issues"
Output:
  - Finding: Missing RLS policy on 'prestadores' table → add SELECT policy
  - Finding: select('*') exposes all columns → use explicit column list
```

---

## 5. Progressive Disclosure

Don't load everything at once. Structure skills to load information conditionally.

```markdown
## Quick Reference
[The 20% that covers 80% of cases — always loaded]

## Domain-Specific Guidance
[Load when domain is identified: "→ see references/domain.md"]

## Edge Cases
[Load only when relevant: "→ see references/edge-cases.md"]
```

Move large reference content to `references/` subfolder:
- Main SKILL.md: < 500 lines
- Each reference file: focused on one concern

---

## 6. Script Bundling

Bundle helper scripts when you observe repeated patterns in execution:
- Claude creates the same helper function across multiple runs → bundle it
- Claude repeatedly works around the same error → fix it in the skill
- Claude always does X before Y → make X a prerequisite step

Scripts go in `scripts/` subfolder alongside the skill.

---

## 7. Standard Data Schemas

For skills that produce structured data, define schemas explicitly:

```markdown
## Output Schema
```json
{
  "skill": "skill-name",
  "timestamp": "ISO-8601",
  "findings": [
    {
      "id": "F001",
      "severity": "critical|high|medium|low",
      "category": "security|performance|correctness|style",
      "location": "file:line",
      "description": "string",
      "fix": "string"
    }
  ],
  "summary": {
    "total": 0,
    "by_severity": { "critical": 0, "high": 0, "medium": 0, "low": 0 }
  }
}
```
```

Consistent schemas enable downstream skills to process outputs reliably.

---

## 8. What NOT to Include

| Exclude | Why |
|---------|-----|
| README content | Belongs in project docs, not skill |
| Test results | Ephemeral; belongs in `_workspace/` |
| User manuals | Too general; skills are task-specific |
| General knowledge | Claude already knows this |
| History of changes | Belongs in CLAUDE.md change log |

---

## Skill Reuse Checklist

Before creating a new skill:
```
[ ] Search .claude/skills/ for similar skills
[ ] Can existing skill be extended with a new section?
[ ] Is the overlap intentional (different trigger conditions)?
[ ] Will creating a new skill cause confusion about which to use?
[ ] If reusing: does the change stay within the skill's intended scope?
```

Only generalize within intended responsibility. A `backend-review` skill shouldn't absorb frontend concerns even if there's overlap.
