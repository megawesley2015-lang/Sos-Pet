# Skill Testing & Iterative Improvement Guide

Methodology for validating skill quality and refining through evidence.

---

## Testing Framework

Combines qualitative and quantitative evaluation:
- **Qualitative:** Human review of outputs against expected behavior
- **Quantitative:** Assertion-based automated scoring

---

## Writing Test Prompts

Use realistic, specific prompts — the kind actual users type:

**Bad test prompt:**
```
Extract data
```

**Good test prompt:**
```
Review app/api/pets/route.ts for security issues, focusing on input validation
and RLS compliance
```

The more realistic the prompt, the more the test reflects real activation behavior.

---

## Comparative Execution Structure

For each test prompt, run two sub-agents simultaneously:
- **Agent A:** executes WITH the skill
- **Agent B:** executes WITHOUT the skill

Compare outputs to measure the skill's actual added value.

If Agent B produces the same quality as Agent A → the skill isn't adding value → investigate why.

---

## Assertion-Based Scoring

Define concrete, verifiable assertions for each skill:

```markdown
## Assertions for backend-review skill

PASS if output contains:
  [ ] At least one finding per file reviewed
  [ ] Each finding has: location (file:line), severity, fix suggestion
  [ ] Security findings reference specific OWASP category or RLS rule
  [ ] No finding is "check if this is an issue" — all are definitive

FAIL if:
  [ ] Output is generic advice without file-specific findings
  [ ] Severity labels are absent or inconsistent
  [ ] Fix suggestions are vague ("improve this")
```

**Discriminating assertion principle:** Remove assertions that would pass even without the skill. "Output exists" is not a discriminating assertion — it passes always.

---

## Specialized Evaluation Agents

### Grader Agent
- Evaluates each assertion: PASS / FAIL + rationale
- Produces `_workspace/testing/grading.json`

### Comparator Agent
- Receives anonymized outputs A and B (no skill labels)
- Picks better output + explains why
- Eliminates confirmation bias

### Analyzer Agent
- Reads multiple grading runs
- Identifies statistical patterns
- Reports: "Skill consistently fails at X" or "Skill adds most value in Y scenario"

---

## Iteration Loop

```
1. Run test suite → collect grading.json
2. Analyzer identifies failure patterns
3. Generalize failure to underlying principle (not specific case fix)
4. Update skill body at principle level
5. Re-run test suite
6. Compare scores: improved / neutral / regression
7. Keep change if improved, revert if regression
```

**Generalization rule:** If the skill failed on "missing RLS check for prestadores table", don't add "always check prestadores RLS". Instead add "always verify RLS policies for every table referenced in the query".

---

## Description Trigger Validation

Write 20 eval queries per skill:

**10 should-trigger queries:**
```
"review this API route for security"
"check if this Supabase query has RLS"
"audit this endpoint"
"is this code safe to deploy?"
"find vulnerabilities in this file"
...
```

**10 should-NOT-trigger queries (near-misses):**
```
"explain what RLS is"           ← education, not review
"write a new API route"         ← creation, not review
"what does this code do?"       ← explanation, not review
"fix this bug in my query"      ← debugging, not review
...
```

Target: 100% trigger on should-trigger, 0% trigger on should-NOT.

---

## Workspace Structure

Each test iteration gets its own directory:

```
_workspace/
└── testing/
    └── {skill-name}/
        ├── iter-001-baseline/
        │   ├── with-skill.md
        │   ├── without-skill.md
        │   └── grading.json
        ├── iter-002-after-description-fix/
        │   ├── with-skill.md
        │   ├── without-skill.md
        │   └── grading.json
        └── summary.md
```

Use descriptive directory names — "iter-002-after-description-fix" tells you what changed, unlike "iter-002".

Never overwrite previous iterations — preserve all runs for regression detection.

---

## Standard grading.json Schema

```json
{
  "skill": "skill-name",
  "iteration": "001",
  "timestamp": "2026-06-11T00:00:00Z",
  "test_prompts": [
    {
      "prompt": "...",
      "with_skill_score": 8.5,
      "without_skill_score": 4.2,
      "delta": 4.3,
      "assertions": [
        { "id": "A1", "pass": true, "note": "Found 3 findings with locations" },
        { "id": "A2", "pass": false, "note": "Severity labels missing on 2 findings" }
      ]
    }
  ],
  "summary": {
    "avg_with_skill": 8.1,
    "avg_without_skill": 4.5,
    "avg_delta": 3.6,
    "pass_rate": 0.72
  }
}
```
