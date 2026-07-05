# SmartStudy — Technical Review & Change Report

**Scope:** Spring Boot 3.5 / Java 17 backend, React + Vite + TypeScript frontend, MySQL, JWT auth, Flyway, Docker-sandboxed code execution.
**Reviewed:** full backend security/architecture pass + full frontend architecture/code-quality pass, verified against source (not docs).
**Date:** 2026-07-03

---

## 0. Immediate action item (do this before anything else)

**`backend/src/main/resources/application.properties:43`** hardcodes a live API key in a file tracked by git:
```
grok.api.key=sk-Mp8Qw2ZxLc7Tn5Rv4Hy9Kj3Bd6Ua1FsE
```
This is a committed secret. **Rotate the key now** (assume it's compromised — it's visible to anyone with repo access/history), move it to `${GROQ_API_KEY}` env-var style like the JWT secret already does, and remove it from git history if the repo is or will be shared/public (`git filter-repo` or BFG). This is independent of the rest of the report — do it first.

---

## 1. Architecture Overview

**Backend** — layered Spring Boot: `Config` (security/JWT), `controller`, `DTO/{Request,Response}`, `Model/{Entity,Enum}`, `Repository`, `Service/Impl`, centralized `GlobalExceptionHandler`. Stateless JWT auth (HS256), role-based routing configured centrally in `SecurityConfig` rather than scattered `@PreAuthorize` — a deliberate and defensible choice (single audit point). Docker-sandboxed multi-language code execution (Python/JS/TS/Java/C++/PHP) via `docker-java`, network-isolated, resource-capped containers. Flyway-managed MySQL schema.

**Frontend** — React 18 + Vite + TS. Clean API-layer separation (`src/api/*.ts` — pages never call `axios` directly, with two exceptions, see §2.4). State is Context-only (`AuthContext`, `ThemeContext`, `ToastProvider`) — appropriate for the app's size. No server-state cache (React Query/SWR) — every page independently refetches on mount.

**Data flow**: React → axios (JWT bearer, `/api` proxy) → Spring controllers → services → JPA/Hibernate → MySQL, with a side channel to Docker for code execution and to Groq for AI (PDF→MCQ generation, code analysis).

**Overall maturity rating: solid mid-stage prototype, stronger than typical PFE baseline on backend security fundamentals, let down by one shipped functional regression and some polish gaps.**
- **Production-ready:** JWT filter chain, password hashing (BCrypt), global exception handling (no stack-trace leakage), Docker sandbox core isolation (network/pids/cpu/mem limits, `no-new-privileges`), CORS explicit allowlist, service-layer IDOR checks on session ownership.
- **Fragile / needs work before any real deployment:** hardcoded secret in committed config, sandbox containers still run as root with a writable filesystem (missing the last hardening step), no rate limiting anywhere, no JWT revocation, and — critically — **the entire student quiz-taking flow is unreachable from the UI** (see §2.5).

---

## 2. Findings — Weaknesses & Risks

Severity scale: **Critical** (exploitable/broken now) · **High** · **Medium** · **Low**.

### 2.1 Security — Backend

| # | Finding | File(s) | Severity |
|---|---|---|---|
| 1 | Groq/xAI API key hardcoded in a committed properties file | `application.properties:43` | **High** |
| 2 | `spring.datasource.password` falls back to literal `1234` if `DB_PASSWORD` unset | `application.properties:9` | Medium |
| 3 | No rate limiting on `/api/auth/login` (brute-force) or `/api/code/execute` (resource-exhaustion DoS — each call spins a real container) | `AuthController`, `CodeExecutionController` | Medium |
| 4 | No JWT revocation/logout mechanism; 24h token lifetime, no refresh flow — a stolen token is valid for the full day with no way to shorten it | `JwtTokenProvider`, `JwtAuthenticationFilter` | Medium |
| 5 | JWT secret has a hardcoded dev-fallback default in `application.properties` — if `JWT_SECRET` env var is ever unset in a real deployment, a publicly-known weak secret silently activates instead of failing fast | `application.properties:31` | Medium |
| 6 | Docker sandbox containers run **as root**, with **no `--read-only` filesystem** and **no `--cap-drop=ALL`** — the one missing layer in an otherwise well-designed sandbox (network disabled, pids capped, memory/cpu capped, `no-new-privileges` set are all already correct) | `DockerSandboxService.java` | Medium-High |
| 7 | Unverified: if the Spring Boot app itself runs in a container with the host's `/var/run/docker.sock` bind-mounted in, any RCE grants full host root via the Docker API. No `Dockerfile`/`docker-compose.yml` found to confirm actual deployment topology — needs explicit verification | `CodeExecutionController` (Docker socket config) | High (unverified) |
| 8 | `GET /api/sessions/{id}` and quiz/leaderboard endpoints are `.authenticated()`-only, not scoped to session membership at the URL/security layer — ownership enforcement for *closing/duplicating* a session is correctly done in the service layer, but read access to a session's/quiz's details by ID was not confirmed to be membership-scoped | `SecurityConfig.java`, `SessionServiceImpl`, `QuizServiceImpl` | Medium (unverified, needs a follow-up read of `getSessionById`) |
| 9 | Two DTOs (`DuplicateSessionRequest`, `RequestDep`) have no Bean Validation annotations | `DTO/Request/` | Low |
| 10 | Leftover Angular CORS origin (`localhost:4200`) still allowed — dead attack surface from the frontend migration | `SecurityConfig.java` | Low |
| 11 | `pdfbox` 2.0.29 is EOL/maintenance-only; the app parses arbitrary user-uploaded PDFs, a classic exploit vector for malformed-file parsers | `pom.xml` | Low-Medium |

**What's already good** (worth stating explicitly in the report, a jury will ask "did you think about security?"): parameterized queries throughout (no raw string-concatenated `@Query` found), BCrypt password hashing, centralized exception handling that never leaks stack traces to clients, `no-new-privileges` + network isolation + pid/cpu/memory caps on sandbox containers, roles re-fetched from DB per request rather than trusted from stale JWT claims, generic auth error messages that don't leak account existence.

### 2.2 Frontend — Functional Bug (Critical)

**The entire student quiz-taking UI is unreachable.** `src/pages/StudentQuiz.tsx` (311 lines, fully implemented: countdown timer, auto-submit, answer persistence) and `src/pages/QuizResults.tsx` (301 lines, fully implemented: leaderboard, rank display) are complete components that are **never imported or routed in `src/App.tsx`**. Both `StudentSession.tsx:361` and `StudentQuiz.tsx:88` navigate to `/student/session/:id/quiz` and `/student/session/:id/quiz/results`, but only `/student/session/:id` is registered — any student clicking "Start quiz" or "View results" falls through to the catch-all route and is bounced back to their dashboard. This must be fixed before any demo or jury evaluation — it currently makes quizzes unusable from a student's perspective despite the backend and UI both being fully built.

### 2.3 Frontend — Auth/Token Handling

- JWT stored in `localStorage` (`ss_token`) — readable by any injected script (XSS risk), no CSP found to mitigate. No token-expiry check or refresh flow; expiry is discovered reactively via a 401.
- On 401, the axios interceptor does a full `window.location.href` redirect (loses SPA state) rather than a router navigation.
- Two AI-analysis calls (`CodeEditor.tsx:72`, `StudentSession.tsx:169`) bypass the shared axios instance entirely via raw `fetch()`, so they get **no timeout, no 401 auto-logout, no centralized error handling** — inconsistent with the rest of the codebase and a real UX gap (a hung AI call spins forever with no `AbortController`).

### 2.4 Frontend — Code Quality / Maintainability

- **Duplication**: `LangBadge` component byte-identical in two files; ~150 lines of near-identical run/AI-analyze logic duplicated between `CodeEditor.tsx` and the code-mode branch of `StudentSession.tsx`. Clear candidates for a shared `useCodeExecution` hook and a shared `LangBadge` component.
- **Oversized components**: `ProfessorSession.tsx` (790 lines, 4 concerns in one file), `QuizCreator.tsx` (621 lines), `StudentSession.tsx` (619 lines, handles two unrelated session modes via one giant conditional).
- **No error boundary anywhere** — an uncaught render error (e.g. Monaco editor failing to load) produces a blank white screen with no recovery UI.
- **No client-side file validation** on PDF upload: filename-suffix check only (not MIME type), and the advertised "50 Mo max" limit in `PdfSimplifier.tsx` is never actually enforced client-side.
- **No test suite**: Playwright is installed as a devDependency but wired into nothing — zero `*.test.*`/`*.spec.*` files exist, no `playwright.config.ts` found.
- Inconsistent error-surfacing: some pages use the Toast system, some use inline `<div>` banners — no single convention.
- No `.env`/`VITE_*` config — API base is hardcoded to relative `/api`, meaning switching backend hosts for staging/prod requires editing `vite.config.ts` or matching reverse-proxy config rather than an env var.

### 2.5 Scalability Concerns

- No server-state caching on the frontend (React Query/SWR) — every page navigation refetches the same session/quiz data from scratch.
- No connection pooling / concurrency cap visible on Docker sandbox execution — nothing stops N simultaneous `/api/code/execute` calls from spinning up N containers, each holding real CPU/memory, with no queue or per-user limit.
- Single MySQL instance, no read replicas or caching layer — acceptable for a PFE scale, but worth naming as a known limitation in the report rather than silently ignoring it.

---

## 3. Recommendations — What to Add / Improve

### 3.1 Critical / Must-Have (fix before any demo or submission)

| Item | Why | Effort |
|---|---|---|
| **Wire `StudentQuiz`/`QuizResults` routes into `App.tsx`** | The quiz feature is currently unusable from the student side; this is the single most visible defect a jury could hit live | Trivial (~15 min: add two `<Route>` entries + imports) |
| **Rotate & externalize the hardcoded Groq/xAI API key** | Live credential committed to git; also a jury red flag if they read the repo | Small (env var + `.gitignore` check, ~30 min) |
| **Remove the `1234` DB password fallback and the JWT-secret dev fallback** (fail fast on missing env vars instead) | A jury/security-minded evaluator will immediately flag silent-insecure-defaults as a red flag; also just good practice | Small |
| **Harden Docker sandbox: non-root user, `--read-only` root filesystem, `--cap-drop=ALL`** | Closes the one real gap in an otherwise well-built sandbox; directly demonstrates security awareness, which PFE juries specifically reward for a "code execution" feature | Medium (a few hours: adjust `HostConfig` in `DockerSandboxService`, verify each language image still runs read-only with a writable `/tmp` tmpfs mount) |
| **Basic rate limiting on `/api/auth/login` and `/api/code/execute`** | Prevents brute-force and trivial DoS; commonly asked about by juries evaluating a "production-ready" claim | Medium (Bucket4j or a simple in-memory token bucket filter, ~half a day) |

### 3.2 Nice-to-Have (meaningfully strengthens the project)

| Item | Why | Effort |
|---|---|---|
| Move to httpOnly cookie for JWT storage (or at minimum add a CSP header) | Removes the XSS-token-theft vector, a standard "what would you improve" jury question | Medium (requires backend cookie-setting + CSRF token since cookies bring CSRF back into scope) |
| Add JWT refresh-token flow + logout/revocation (short-lived access token + refresh token, or a server-side deny-list) | Currently a stolen token lives for 24h with no way to kill it — an easy, well-understood improvement to describe in a report | Medium |
| Route the two stray `fetch()` AI calls through the shared axios instance | Consistency, timeout handling, auto-logout-on-401 coverage | Small |
| Extract shared `useCodeExecution` hook + `LangBadge` component to remove duplication | Cleaner codebase to present/defend in front of a jury, less risk of divergent bugs between prof/student code editors | Small-Medium |
| Add a global React error boundary | Prevents blank-screen crashes; cheap, visible robustness win for a live demo | Small |
| Enforce PDF MIME-type + size validation client-side (matching the advertised 50MB limit) and server-side | Currently a gap between advertised and enforced limits; also a minor DoS vector on the PDF summarizer | Small |
| Add a minimal test suite (Vitest + React Testing Library for a few key components; Playwright for one E2E happy path since it's already installed) | A PFE jury consistently rewards *any* automated testing; "installed but unused Playwright" currently looks worse than having none | Medium |
| Add `management.endpoints.web.exposure.include=health` explicitly in `application.properties` | Currently safe by Spring Boot 3 defaults, but explicit is safer than implicit if actuator deps grow later | Trivial |
| Introduce React Query (or SWR) for server-state caching/dedup | Removes redundant refetching across pages, real scalability/perf talking point for the report | Medium |

### 3.3 Bonus / Impressive (would stand out to a jury)

| Item | Why | Effort |
|---|---|---|
| Per-user concurrency cap / queue on code execution | Demonstrates real scalability thinking about the most resource-intensive feature in the app | Medium |
| Audit logging of admin actions and session/quiz access (who did what, when) | Common ask in academic-platform PFEs re: accountability/traceability, easy to justify in the report | Medium |
| CI pipeline (GitHub Actions: build + lint + test on push) | Visible engineering maturity signal, cheap to set up given Maven/npm scripts already exist | Small-Medium |
| Dockerize the whole stack with `docker-compose.yml` (backend + MySQL + frontend) for one-command local/demo setup | Makes the jury demo trivially reproducible on any machine, also finally answers the "is the docker socket bind-mounted?" open question from §2.1 #7 by making the deployment topology explicit | Medium |
| Real-time leaderboard/session updates via WebSocket instead of 5s polling | The leaderboard already polls every 5s (`ProfessorSession.tsx`) — swapping to STOMP/WebSocket is a natural, demonstrable upgrade that touches both stacks | Medium-Large |
| OpenAPI/Swagger spec + generated TypeScript types from it | Eliminates the manual DTO-mirroring drift risk already noted between frontend `types/index.ts` and backend DTOs | Medium |

---

## 4. Change Log Table (for direct inclusion in the PFE report)

| # | Module / File(s) | Change | Reason | Priority |
|---|---|---|---|---|
| 1 | `frontend/src/App.tsx` | Register routes for `StudentQuiz` and `QuizResults` | Quiz-taking flow is currently unreachable — critical functional bug | Critical |
| 2 | `backend/.../application.properties` | Remove hardcoded Groq/xAI key; rotate the exposed key; use `${GROQ_API_KEY}` | Live secret committed to git | Critical |
| 3 | `backend/.../application.properties` | Remove `:1234` and JWT-secret dev fallbacks; fail fast if env vars missing | Silent insecure defaults in a committed file | Critical |
| 4 | `backend/.../DockerSandboxService.java` | Add non-root user, `--read-only` fs (+ tmpfs `/tmp`), `--cap-drop=ALL` to sandbox `HostConfig` | Sandbox currently runs untrusted code as root with a writable filesystem and full capabilities | Critical |
| 5 | `backend/.../AuthController.java`, `CodeExecutionController.java` | Add rate limiting (e.g. Bucket4j) | Brute-force login risk; DoS risk via unthrottled container spin-up | Critical |
| 6 | `backend/.../JwtTokenProvider.java`, new refresh endpoint | Add refresh token + logout/revocation | 24h token with no revocation is a standing risk window | Nice-to-have |
| 7 | `frontend/src/context/AuthContext.tsx`, backend cookie handling | Move JWT to httpOnly cookie (or add CSP) | Mitigate XSS token theft from `localStorage` | Nice-to-have |
| 8 | `frontend/src/pages/CodeEditor.tsx`, `StudentSession.tsx` | Replace raw `fetch()` AI calls with the shared `api` axios instance | Missing timeout/401-handling/error consistency | Nice-to-have |
| 9 | `frontend/src/pages/CodeEditor.tsx`, `StudentSession.tsx`, `ProfessorSession.tsx` | Extract shared `useCodeExecution` hook + `LangBadge` component | Remove ~150 lines of duplicated logic | Nice-to-have |
| 10 | `frontend/src/App.tsx` or a new top-level wrapper | Add a global error boundary | Prevent blank-screen crashes on render errors | Nice-to-have |
| 11 | `frontend/src/pages/QuizCreator.tsx`, `PdfSimplifier.tsx`; backend PDF endpoints | Enforce MIME-type + size validation for PDF uploads, client and server side | Advertised 50MB limit is currently unenforced | Nice-to-have |
| 12 | `frontend/` | Add Vitest/RTL unit tests + wire the already-installed Playwright into at least one E2E test | No automated tests currently exist despite tooling being present | Nice-to-have |
| 13 | `backend/.../application.properties` | Add explicit `management.endpoints.web.exposure.include=health` | Make actuator exposure explicit rather than relying on implicit defaults | Nice-to-have |
| 14 | `backend/.../SecurityConfig.java` | Remove leftover `localhost:4200` CORS origin | Dead attack surface from completed Angular→React migration | Nice-to-have |
| 15 | `frontend/` (new dependency) | Introduce React Query/SWR for server-state caching | Removes redundant refetching, improves perceived performance | Bonus |
| 16 | Repo root | Add `docker-compose.yml` for full-stack local orchestration | Reproducible demo setup; clarifies Docker socket deployment topology | Bonus |
| 17 | `backend/.../QuizController.java` (or WebSocket config) | Replace 5s leaderboard polling with WebSocket/STOMP push | Demonstrable real-time upgrade over current polling | Bonus |
| 18 | Repo root | Add GitHub Actions CI (build+lint+test) | Engineering maturity signal for the jury | Bonus |
| 19 | `backend/pom.xml` | Upgrade `pdfbox` 2.0.29 → 3.x | 2.x branch is EOL; app parses untrusted user-uploaded PDFs | Nice-to-have |
| 20 | `backend/.../SessionServiceImpl.java`, `QuizServiceImpl.java` | Verify/add membership scoping on `getSessionById` and quiz/leaderboard reads | Potential IDOR — any authenticated user may be able to read another session's/quiz's data by ID (unverified, needs a direct code read to confirm before fixing) | Critical (pending verification) |

---

## 5. Items Needing Direct Verification Before Acting

Two findings above were flagged by the reviewing agents as **plausible but not fully confirmed** — read the actual methods before implementing the corresponding fix:
1. **#20 above** — whether `SessionServiceImpl.getSessionById` / `QuizServiceImpl` leaderboard/quiz reads are scoped to session membership, or open to any authenticated user regardless of enrollment.
2. **§2.1 #7** — whether the backend's own deployment (no `Dockerfile`/`docker-compose.yml` found in this pass) bind-mounts the host Docker socket, which would make sandbox RCE equivalent to host root.
</content>
