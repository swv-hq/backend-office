# Code Review Checklist

Run this checklist before declaring any unit of work complete. Focus on the files you changed — don't review the entire codebase.

## Architecture

- [ ] Code follows the project's architectural patterns (check CLAUDE.md or architecture docs)
- [ ] No business logic in the API/controller layer — it belongs in services/use cases
- [ ] Dependencies flow in the right direction (no circular imports, no layer violations)
- [ ] New abstractions are justified — three similar usages before extracting

## Security

- [ ] Auth checks on all new endpoints/functions that access user data
- [ ] Ownership verification — users can only access their own resources
- [ ] Input sanitization at system boundaries (user input, external API responses)
- [ ] No sensitive data in logs (tokens, passwords, PII)
- [ ] No secrets hardcoded in source (API keys, connection strings)
- [ ] No injection vulnerabilities (SQL injection, XSS, command injection)

## Performance

- [ ] No N+1 queries — batch database calls where multiple records are needed
- [ ] Queries use indexes, not full table scans / unbounded filters
- [ ] Unbounded collections are paginated or limited (`.take(n)`, `LIMIT`, etc.)
- [ ] No expensive computations in hot paths without memoization
- [ ] No unnecessary re-renders in frontend components

## Type Safety

- [ ] No `as any` casts or `@ts-ignore` comments (use proper types)
- [ ] Function signatures have explicit parameter and return types where the language supports it
- [ ] Database IDs use typed identifiers, not raw strings

## Test Quality

- [ ] All acceptance criteria have linked tests (tagged with AC/issue IDs)
- [ ] Tests cover both happy path and error cases
- [ ] Tests verify authorization boundaries (cross-user access denied)
- [ ] Tests are independent — no shared mutable state, no order dependencies
- [ ] Mocks are minimal — prefer real implementations where feasible
- [ ] No unused mocks or test setup code

## Accessibility (if UI changes)

- [ ] Form inputs with errors have `aria-invalid` and `aria-describedby`
- [ ] Dynamic content updates use `role="status"` and `aria-live="polite"`
- [ ] Interactive elements are keyboard accessible
- [ ] Color is not the only means of conveying information

## Code Quality

- [ ] No unused imports, variables, or dead code
- [ ] Error messages are descriptive and actionable
- [ ] Naming is clear and consistent with project conventions
- [ ] No commented-out code left behind
- [ ] Changes are minimal — no scope creep, no drive-by refactoring

## How to Use This Checklist

1. **Review each changed file** against the applicable sections
2. **Classify findings** as critical (must fix), high (should fix), or low (nice to have)
3. **Fix all critical and high items** before declaring done
4. **Fix low items in code you wrote for this feature — default is fix, not defer.** If the finding is in a file this change added or modified, the fix is the default action. Do not ask permission, do not file a follow-up, do not list it as "outstanding" in the report — just fix it as part of the review pass. This includes: renames, unused imports, missing types, one-line guards, tightening error messages, replacing magic numbers with named constants, splitting an oversized function, deleting dead branches, fixing comment/code drift, adding a missing `aria-*` attribute, narrowing an overly broad type. The bar to fix is low; the bar to defer is high.

   Only defer a low finding when **all** of the following are true: (a) the fix touches code outside the files this change added or modified, (b) the fix requires a design decision the user hasn't made, or (c) the fix is large enough that bundling it would obscure the feature diff in review. "I wasn't sure" is not a reason to defer — make the call and fix it. When in doubt, fix it; the user can revert in review if they disagree.

   Pre-existing issues in unchanged code are out of scope — note them as follow-ups, do not fix them inline.

5. **Report what you fixed.** In the Phase 4 findings list, low items you fixed should appear with status `fixed`, not omitted. The user wants to see that the review pass actually did the work.
6. **Document remaining low items** (the small set that met the defer bar above) as follow-up issues if worth tracking.
