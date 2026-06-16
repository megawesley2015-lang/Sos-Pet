# QA Agent Guide — Boundary Mismatch Detection

## Problem

Static code review and TypeScript build success alone don't catch **boundary mismatch bugs** — runtime errors where two independently-correct components don't agree at their connection point.

Classic example: API returns `{ data: { pets: [] } }` but the frontend hook expects `{ pets: [] }` — both sides pass type checks, but the integration fails.

---

## 6 Boundary Mismatch Patterns

### 1. API Response Shape ↔ Frontend Hook Types

```
API route:     return NextResponse.json({ success: true, data: { pets } })
Frontend hook: const { pets } = await fetchJson('/api/pets')
               ↑ Missing .data wrapper — pets is undefined
```

**Check:** Compare `NextResponse.json()` shape in route files against the TypeScript generic in corresponding `fetch*` hooks.

---

### 2. Field Naming: camelCase vs snake_case

```
Supabase returns:  { photo_url, contact_phone, owner_id }
Frontend expects:  { photoUrl, contactPhone, ownerId }
                    ↑ Without mapping layer, all fields are undefined
```

**Check:** Are field names transformed anywhere? Is the transformation consistent across all uses?

---

### 3. File Paths ↔ URL Segments in Links/Router

```
File exists at:  app/achados-e-perdidos/[id]/page.tsx
href in code:    `/pets/${id}`
                  ↑ Wrong path segment — 404 in production
```

**Check:** Every `href`, `router.push()`, and `redirect()` in the codebase matches an actual file path in `app/`.

---

### 4. State Transition Maps ↔ Actual Status Update Code

```
State machine defines:  lost → active → resolved → removed
Actual update code:     .update({ status: 'found' })
                                          ↑ 'found' not in state machine — invalid state
```

**Check:** Every `status` value written in PATCH/UPDATE calls is defined in the state machine or schema CHECK constraint.

---

### 5. Endpoint Exists ↔ Actually Called from Hooks

```
API route exists:  /api/pets/lost-active
No hook calls it:  grep for 'lost-active' in hooks/ → 0 results
                   ↑ Dead endpoint OR hook is using a different URL
```

**Check:** For each API route, find at least one caller in the frontend. For each frontend fetch, find the matching API route.

---

### 6. Sync vs Async Response Shapes

```
Immediate response:  { job_id: "abc123", status: "processing" }
Final response:      { success: true, data: { result: "..." } }
Frontend expects:    result immediately after fetch
                     ↑ Shape mismatch — polling required but not implemented
```

**Check:** Are any endpoints async/queued? If so, does the frontend handle polling or webhooks?

---

## The "Both Sides Simultaneously" Principle

QA validation must always compare **producer and consumer together**:

| Producer | Consumer |
|----------|----------|
| `NextResponse.json()` in route file | `fetchJson<T>` generic in hook |
| File in `app/` directory | `href` / `router.push()` values |
| State machine / schema CHECK | `.update({ status: '...' })` calls |
| API endpoint URL | `fetch('/api/...')` calls in frontend |

Reading only one side misses the contract mismatch.

---

## QA Agent Configuration

**Agent type:** `general-purpose` (NOT `Explore`)
- Reason: QA agent needs to run grep scripts to find patterns across files
- `Explore` type is read-only and cannot execute search scripts

**Timing:** Run QA after each module completes, not only at the end.
- Incremental QA catches issues while context is fresh
- End-only QA requires archaeology to trace root causes

---

## QA Checklist Templates

### API ↔ Hook Contract Checklist
```
For each API route in app/api/**:
[ ] Find the response shape (NextResponse.json payload)
[ ] Find all callers (grep for the URL path)
[ ] Verify caller's type parameter matches response shape
[ ] Check error response shape matches caller's error handling
```

### Routing Checklist
```
For each href/router.push in components/ and app/:
[ ] Verify target path exists in app/ directory
[ ] Check dynamic segments match [param] names exactly
[ ] Verify no missing route group prefixes (e.g., (marketing)/)
```

### State Machine Checklist
```
For each table with status/kind column:
[ ] List all valid values from schema CHECK or TypeScript enum
[ ] Find all .update({ status: '...' }) calls
[ ] Verify every written value is in the valid set
[ ] Check every transition is handled in the UI
```

### Data Flow Checklist
```
For each major user flow:
[ ] Trace data from user input → API → database → API response → UI display
[ ] At each boundary, verify field names match
[ ] At each boundary, verify nesting/wrapping matches
[ ] Check that no field is silently dropped at any step
```

---

## SOS Pet Aumigo Specific Boundaries to Check

```
pets_public view ↔ PetCard component props
  - View columns: id, name, species, kind, status, city, photo_url, created_at
  - PetCard props: match exactly? camelCase mapping needed?

/api/pets response ↔ usePaginatedPets hook
  - Does response include pagination metadata?
  - Does hook expect { data, count } or { pets, total }?

/api/ong/adoption/[id] ↔ ONG adoption detail page
  - Does route return nested relations or flat structure?
  - Does page expect { adoption: { pet: {...}, adopter: {...} } }?

contact_name / contact_phone ↔ pet detail page only
  - Verified: these NEVER appear in pets_public view
  - Verified: only /achados-e-perdidos/[id] route fetches from pets (not pets_public)
```
