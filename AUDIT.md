# Code Audit — Logan's Excavating (studio)

_Audit date: 2026-06-09 · Branch: `claude/line-by-line-audit-bpenn8`_

A line-by-line review of the Next.js 14 + Firebase + Genkit codebase (192 source
files). The focus is on **real bugs and security/architecture risks**, not style.

---

## 0. Build & type health (good news first)

| Check | Result |
|-------|--------|
| `npm install` | OK (note: 57 npm-audit advisories, 3 critical — transitive deps) |
| `tsc --noEmit` (typecheck) | ✅ **0 errors** |
| `next build` | ✅ Compiles successfully (benign OpenTelemetry warning only) |
| `next lint` | ❌ **Broken** — ESLint config uses options removed in the installed ESLint (`useEslintrc`, `extensions`, …). Linting never runs. |

> The two committed files `typecheck_errors.txt` and `type_errors_new.txt` are
> **stale** — they describe errors that no longer exist (they were captured
> before dependencies were installed / before the last commit). They should be
> deleted to avoid confusion.

---

## 1. CRITICAL — Architecture: server actions use the *client* Firestore SDK with no auth

This is the root cause of the recurring "Could not load dashboard data" /
"Missing or insufficient permissions" errors visible throughout the git history.

**The problem.** `src/lib/firestoreService.ts` is built entirely on the
**client** SDK (`firebase/firestore`) — there is no `firebase-admin` anywhere in
the project. Server Actions then import and call those same functions:

- `src/app/actions/getEmployeeDashboardData.ts` (`'use server'`) calls
  `getJobsForUser`, `getTasksForUser`, `getReportsForUser`, `getCalendarEvents`.
- Same pattern in `getFleetHealthData.ts`, `getAdvancedReportData.ts`,
  `getJobCost.ts`, `runInspectionAnalysis.ts`.

When a client-SDK query runs **on the server**, there is no signed-in user, so
`request.auth == null` and **every security rule that requires auth denies the
read**. The action's `.catch` then swallows the rejection and returns empty
arrays — the UI shows "Could not load dashboard data."

**Fix.** Server Actions must use the **Firebase Admin SDK** (service-account
credentials, bypasses rules) and verify the caller's identity from a passed ID
token — *not* the client SDK. Concretely:

1. Add `firebase-admin`, initialise it once server-side with a service account.
2. In each action, accept the caller's ID token, `verifyIdToken()` it, and use
   the decoded `uid`/role for authorization (see §3).
3. Have actions read/write through the Admin SDK.

Until this changes, no server-action-backed page can reliably load data.

---

## 2. CRITICAL — Firestore rules use an invalid `request.query.where` construct

`firestore.rules` gates almost every employee-facing `list` on expressions like:

```
match /tasks/{taskId} {
  allow list: if isAdmin() || (request.query.where.assignedToEmployeeId == request.auth.uid);
}
```

Same pattern on `violations`, `inspectionReports`, `expenseReports`,
`timeOffRequests`, `documents`, and `notifications`.

**`request.query` does not have a `.where` member.** Firestore Security Rules
expose only `request.query.limit`, `.offset`, and `.orderBy` — there is no way to
inspect a query's `where` clauses ("rules are not filters"). Accessing
`request.query.where` errors at evaluation time, so the whole rule denies. Every
employee query in `firestoreService.ts` that filters by `employeeId` /
`assignedToEmployeeId` (`getReportsForUser`, `getTasksForUser`,
`getExpenseReportsForUser`, `getViolationsForUser`, `getDocumentsForUser`,
`getTimeOffRequestsForUser`) is being **denied on the client** for the same
reason.

**Fix.** Reference `resource.data` instead. Firestore's query analyzer then
*requires* the client query to be constrained so every returned doc satisfies the
rule. Example:

```
// BEFORE (always denies)
allow list: if isAdmin() || (request.query.where.assignedToEmployeeId == request.auth.uid);
// AFTER (works; client must query where('assignedToEmployeeId','==', uid))
allow list: if isAdmin() || resource.data.assignedToEmployeeId == request.auth.uid;
```

Apply the same `resource.data.<field>` rewrite to every list rule and to the
`notifications` rule (`resource.data.recipientId == ...`). The client queries are
already correctly constrained, so this alone fixes employee-side reads. (The
server-action path still needs §1.)

---

## 3. HIGH — Server Actions are unauthenticated public endpoints

Server Actions compile to public HTTP endpoints; anything exported can be invoked
by any client with any arguments. None of these verify the caller:

| Action | Risk |
|--------|------|
| `getEmployeeDashboardData({ userId })` | Caller passes **any** `userId` → reads another employee's jobs/tasks/reports (IDOR). |
| `runInspectionAnalysis(reportId)` | Any user can run (paid) AI analysis on any report id. |
| `getAdvancedReportData(...)` | Returns company-wide financials/violations to any caller (employees included). |
| `getFleetHealthData(...)` | Returns fleet-wide health metrics with no role check. |
| `getJobCost(job)` | Returns cost/margin breakdown to any caller. |

**Fix (depends on §1).** Once the Admin SDK is in place, derive identity from a
verified ID token and check role/ownership inside each action (e.g.
`if (decoded.uid !== userId && !isManager) throw`). Do **not** trust a `userId`
argument as identity.

---

## 4. HIGH — `notifications` update rule is over-permissive

```
match /notifications/{notificationId} {
  allow update: if isSignedIn(); // comment says "To mark as read"
}
```

This lets **any signed-in user edit any field of any notification** (body,
`recipientId`, etc.), not just flip their own read flag.

**Fix.** Restrict to the recipient and to the read flag only, e.g. require
`resource.data.recipientId in ['all', request.auth.uid]` and that the update only
changes `read`/`readBy` (use `request.resource.data.diff(resource.data)
.affectedKeys().hasOnly([...])`).

---

## 5. HIGH — Systemic: admin writes have no error handling / optimistic-UI desync

Across the `Manage*ClientPage.tsx` files (tasks, expenses, rentals, violations,
requests, work-orders, documents, calendar, maintenance-logs, snow-routes) the
recurring pattern is:

```
await addX(...);            // not wrapped in try/catch
setLocalState(updated);     // optimistic update runs even if the write threw
toast({ title: 'Saved' });  // success toast fires regardless
```

If the Firestore write fails (very likely today, per §1/§2), the promise
rejection is unhandled, the user sees a success toast, and the local UI silently
diverges from the server.

`UserManagementClientPage.tsx` is the **good** counter-example (proper
`try/catch`, error toast, batch write) — use it as the template.

**Fix.** Wrap each write in `try/catch`; only mutate local state and show success
*after* the await resolves; show a destructive toast on failure.

Related: several forms send `.optional()` Zod fields straight through to
Firestore (e.g. `ManageRentalsClientPage` `contactInfo`/`notes`,
`MaintenanceLogs` `cost`/`mechanic`, `ManageDocuments` spread of `...values`).
**Firestore rejects `undefined` field values**, so an unfilled optional field can
make the whole write throw. Strip undefined keys before writing.

---

## 6. MEDIUM — AI flows: input validation & prompt-injection surface

`src/ai/flows/*`:

- `answer-help-question-schema.ts:7` — `role: z.string()` should be
  `z.enum(['owner','manager','employee'])`; the raw string is interpolated into
  the prompt and used for FAQ access filtering.
- `create-job-from-prompt.ts` — user `prompt` is interpolated into the LLM prompt
  via string templating; classic prompt-injection vector. Pass user text as a
  distinct structured input and constrain with the output schema/tools.
- `summarize-document.ts` / `extract-receipt-data.ts` — `*DataUri` is passed to
  the model with no format/size validation; a huge or malformed data URI causes
  resource exhaustion / opaque errors. Validate the `data:` prefix and cap size.
- `analyze-inspection-reports.ts:11` — `z.custom<InspectionReport>()` performs no
  runtime validation; use a real `z.object({...})`.
- `optimize-snow-route-flow.ts` — when the model drops/duplicates job ids it
  silently returns the original order; prefer throwing so the caller knows.

These are lower priority than §1–§4 but should be hardened before production.

---

## 7. LOW — Assorted

- **Calculators (`src/components/tools/`)** — math verified across all of them
  (volume → yd³ via `/27`, density → tons, area ratios, paint/sealer coverage,
  unit conversions): **all correct**, NaN/empty inputs are guarded. One real
  edge case: `SlopeCalculator.tsx:16` guards `run <= 0` but not `rise <= 0`, so a
  rise of `0` produces `ratio = "1 : Infinity"`. Add `|| R <= 0` to the guard
  (or special-case a flat slope).
- **`FirebaseProvider`** (`src/firebase/provider.tsx:90`) sets
  `isUserLoading: false` as soon as the auth user is known, *before* the profile
  (`appUser`) document loads. There's a window where `isUserLoading === false`
  but `user === null`; `RouteGuard` then treats the user as `'guest'` and may
  redirect a valid user. Consider keeping `isUserLoading` true until the first
  profile snapshot resolves.
- **Dead code** — `createUserWithEmailAndPassword` is imported in
  `non-blocking-login.tsx` but never used; there is no in-app signup path
  (consistent with `/users` being owner-write-only). Confirm users are
  provisioned out-of-band.
- **`next lint` is non-functional** (see §0) — fix the ESLint config so lint runs
  in CI; otherwise lint regressions go unnoticed.
- **Stale artifacts** — delete `typecheck_errors.txt`, `type_errors_new.txt`, and
  the empty `.modified` file.

---

## Priority order

1. **§1** — move server actions to the Admin SDK (unblocks all dashboards).
2. **§2** — rewrite `firestore.rules` list rules to `resource.data.<field>` (unblocks client reads).
3. **§3** — add identity/role checks to every server action.
4. **§4** — tighten the `notifications` update rule.
5. **§5** — add try/catch + undefined-stripping to the `Manage*` pages.
6. **§6 / §7** — AI-flow validation and the smaller fixes.

§1 and §2 together are required before any employee- or dashboard-facing feature
will load data at all.
