# SmartStudy — Full Project Briefing

This is a self-contained technical briefing of the SmartStudy final-year project, written for another AI assistant that has no prior context on this codebase. Repo root: `smqrtstudyV2/`, split into `backend/` (Spring Boot) and `frontend/` (React + Vite).

---

## 1. Overview

SmartStudy is an education platform connecting **professors** and **students** through join-code-based "sessions." A professor creates a session (either a **CODE** exercise or a **QUIZ**), shares a 6-character join code, and students join and participate. The platform also offers two standalone AI-powered tools available to any logged-in user: a **sandboxed multi-language code editor/runner** and a **PDF summarizer**.

### User roles
- **STUDENT** — joins sessions via join code, submits code or takes quizzes, views own results/leaderboard, uses standalone code editor and PDF summarizer.
- **PROF** — creates/closes/duplicates sessions, creates quizzes (manually or AI-generated from a PDF), views student submissions/quiz attempts/leaderboard, also has access to the standalone code editor and PDF summarizer.
- **ADMIN** — platform-wide user management and stats dashboard. Self-registration as ADMIN is blocked in code (`AuthServiceImpl.register` throws if `role == ADMIN`); an ADMIN account can only be created by inserting directly into the `users` table.

### Main features
1. **CODE sessions** — prof sets a language + exercise prompt; students write/run/submit code in a Monaco editor; prof sees a live-polling submissions feed; students can request an AI ("Groq"-branded, actually a self-hosted DeepSeek model) explanation of their error.
2. **QUIZ sessions** — prof creates a multiple-choice quiz either by hand or by uploading a PDF that an AI turns into questions; students take the quiz with an optional countdown timer; a live leaderboard and per-student result breakdown are shown to the prof, students see their own score + leaderboard.
3. **Standalone code editor** (`/code-editor`) — run code without a session, with AI error analysis.
4. **PDF Simplifier** (`/pdf-simplifier`) — upload a PDF, get an AI-generated summary, with history.
5. **Admin dashboard** — user list, delete users, platform stats (`totalUsers`, `totalSessions`, `totalExecutions`, `totalPdfSummaries`).

---

## 2. Tech stack (exact versions)

### Backend (`backend/pom.xml`)
- Java **17** (`java.version=17`, compiler source/target 17)
- Spring Boot **3.5.6** (parent POM), artifact `com.eduai:eduai-backend`
- `spring-boot-starter-webflux` (used only for `WebClient`, calling the AI endpoint — the app is otherwise a servlet-stack MVC app via `spring-boot-starter-web`)
- `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation` 3.5.6, `spring-boot-starter-actuator`, `spring-boot-devtools`
- MySQL: `mysql-connector-j` (runtime), `spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect`
- **Flyway** `flyway-core` + `flyway-mysql` (no explicit version pin — inherited from Spring Boot BOM)
- **JWT**: `io.jsonwebtoken` jjwt-api / jjwt-impl / jjwt-jackson, all **0.11.5**, HMAC-SHA256 signing
- **Docker sandbox client**: `com.github.docker-java:docker-java-core` and `docker-java-transport-okhttp`, both **3.3.4**
- `org.apache.pdfbox:pdfbox` **2.0.29** (PDF text extraction)
- `org.springframework.ai:spring-ai-tika-document-reader` **1.0.3** (declared but PDF extraction actually goes through raw PDFBox in `QuizServiceImpl`, not through this Spring AI reader)
- Lombok (optional, annotation processor)
- Test: `spring-boot-starter-test`, `spring-security-test`

### Frontend (`frontend/package.json`, name `smqrtstudy-frontend`)
- **React** `^18.2.0` + `react-dom` `^18.2.0`
- **Vite** `^4.4.5`, `@vitejs/plugin-react` `^4.0.3`
- **TypeScript** `^5.0.2`
- `react-router-dom` `^6.15.0`
- `axios` `^1.6.0`
- `@monaco-editor/react` `^4.6.0` (code editor)
- `lucide-react` `^0.263.1` (icons)
- Tailwind CSS `^3.3.3` + `postcss` `^8.4.28` + `autoprefixer` `^10.4.15`
- ESLint `^8.45.0` + `@typescript-eslint/*` `^6.0.0`
- `playwright` `^1.60.0` (devDependency — E2E, present but not otherwise documented here)
- No Angular anywhere in the current repo — an older Angular frontend was fully replaced; only a stray CORS comment in `SecurityConfig.java` still references it.

### Dev server / proxy
`vite.config.ts` runs the dev server on port 3000, proxying `/api` → `http://localhost:8080`. `axios.ts` baseURL is `/api`.

---

## 3. Backend architecture

Base package: `com.example.quizplatforme`. Layering:

```
Config/           SecurityConfig, JwtAuthenticationFilter, JwtTokenProvider, GlobalExceptionHandler
DTO/Request/       one class per request body
DTO/Response/      one class per response body
Model/Entity/      JPA entities
Model/Enum/        RoleEnum, PlanEnum, SessionStatus, SubmissionStatus
Model/              ExecutionResult (JPA entity, oddly not under Entity/)
Repository/        Spring Data JPA interfaces
Service/            interfaces (I-prefixed, one typo: IAuthServicelmpl)
Service/Impl/       implementations
Service/Util/       ProcessRunner (legacy, superseded by DockerSandboxService)
controller/         REST controllers (lowercase package, unlike the others)
exception/           custom exceptions
mapper/              UserMapper
payload/              ErrorResponse
```

### JWT auth & security (`Config/SecurityConfig.java`, `JwtAuthenticationFilter.java`, `JwtTokenProvider.java`)
- Stateless (`SessionCreationPolicy.STATELESS`), CSRF disabled, CORS configured centrally in `SecurityConfig` (no `@CrossOrigin` on controllers).
- `JwtAuthenticationFilter` (a `OncePerRequestFilter`, registered before `UsernamePasswordAuthenticationFilter`) reads the `Authorization: Bearer <token>` header, validates it via `JwtTokenProvider`, loads the user via `CustomUserDetailsService`, and populates `SecurityContextHolder`.
- `JwtTokenProvider`: HS256, secret from `${jwt.secret}`, expiry from `${jwt.expiration}` (currently `86400000` ms = 24h). Subject of the token is the user's **email**.
- Authorization rules (see `SecurityConfig.securityFilterChain`), most-specific-first:
  - `/api/auth/**` — public
  - `/api/code/execute`, `/api/code/history` — `STUDENT` or `PROF`
  - `/api/sessions/create`, `/api/sessions/my` — `PROF`
  - `/api/sessions/join/**` — `STUDENT`
  - `POST /api/sessions/*/submit` — `STUDENT`; `GET /api/sessions/*/submissions` — `PROF`; `POST /api/sessions/*/duplicate` — `PROF`
  - Quiz: `POST /api/sessions/*/quiz/create` and `/quiz/generate-from-pdf` — `PROF`; `GET /api/sessions/*/quiz/attempts` — `PROF`; `POST /api/sessions/*/quiz/submit` — `STUDENT`; `GET /api/sessions/*/quiz/leaderboard` and `GET /api/sessions/*/quiz` — any authenticated user
  - `/api/sessions/**` (fallback) — any authenticated user
  - `/api/pdf/**`, `/api/ai/**` — any authenticated user
  - `/api/users/me` — any authenticated user; `/api/users/**` (rest) — `ADMIN`
  - `/api/admin/**` — `ADMIN`
  - `/api/prof/**` — `PROF` (no controller currently maps to this prefix — dead rule)
- Roles are Spring Security roles `ROLE_ADMIN` / `ROLE_PROF` / `ROLE_STUDENT`, derived from `RoleEnum`.
- 401/403 responses are hand-written as JSON directly in `SecurityConfig` (not via `GlobalExceptionHandler`) because Spring Security's filter chain runs before `@RestControllerAdvice` — CORS headers are manually re-applied here too, or the browser would see a CORS failure instead of the real status code.
- **Note (security gap):** `getQuizForStudent`, `submitAnswers`, and `getLeaderboard` in `QuizServiceImpl` never check that the calling student is actually enrolled in the session (`session.getStudents()`) — they only verify the user exists. This is a potential IDOR: any authenticated STUDENT can fetch/submit/see the leaderboard for any quiz session if they know/guess the `sessionId`.

### Docker code sandbox (`Service/Impl/DockerSandboxService.java`)
- Talks to the local Docker daemon via `docker-java` over the Unix socket `/var/run/docker.sock` (configurable: `docker.socket.path`).
- `CodeExecutionController.DockerConfig` builds the singleton `DockerClient` bean (OkHttp transport, 30s connect timeout, 10min response timeout).
- Supported languages and images: `python`→`python:3.12-alpine`, `javascript`→`node:20-alpine`, `typescript`→custom-built `smartstudy-ts:latest` (Node 20 Alpine + global `typescript`/`ts-node`, built automatically on startup if missing), `java`→`eclipse-temurin:21-jdk-alpine` (class name auto-extracted via regex from `public class X`), `cpp`→`gcc:13`, `php`→`php:8.3-alpine`.
- On `@PostConstruct`, base images are pulled asynchronously in the background (`warmUpImages`), and the TypeScript image is built if not present.
- Per-execution isolation: `--network none`, memory limit (`docker.execution.memory-limit-mb`, default 256MB) with swap disabled, CPU capped at 0.5 vCPU (quota/period), `--pids-limit 64`, `no-new-privileges:true` security opt, container force-removed after every run. **Containers run as root with a writable filesystem and no `--cap-drop=ALL`** — no user namespace remapping or read-only rootfs (known hardening gap).
- Code is injected into the container via an in-memory TAR archive copied to `/sandbox/<file>` before start; stdin (if provided) goes to `/sandbox/stdin.txt` and is redirected in the shell command.
- Timeout (`docker.execution.timeout-seconds`, default 30s, or overridden per-call) triggers `SIGKILL` + a `TIMEOUT` status.
- Returns a `CodeResponse` (no persisted `id` — see contract notes below).

### AI usage
Despite being called "Groq" throughout the code (`IGroqAiService`, `GroqAiServiceImpl`, `grok.api.*` properties), the actual configured endpoint (`grok.api.url=http://102.54.244.89:8088/ollama/api/v1`) is a **self-hosted Ollama instance running `deepseek-r1:14b`**, not the real Groq cloud API. Two independent call sites, both using `WebClient` and both reading the same `grok.api.key`:
1. `GroqAiServiceImpl.analyzeError` — `/api/ai/analyze/{executionId}` — builds a French pedagogical prompt (cause / technical detail / fix / advice) from a persisted `ExecutionResult`, calls `/chat/completions`, returns raw assistant text.
2. `QuizServiceImpl.callAiForQuiz` (private, inside the quiz service, not a separate service class) — used by `generateQuizFromPdf`: extracts PDF text via PDFBox (`PDFTextStripper`, capped at `MAX_PDF_CHARS = 12_000` chars), sends a prompt demanding strict JSON `{"questions":[...]}`, strips `<think>...</think>` reasoning blocks the model emits, then parses JSON into `CreateQuestionRequest` list.
- **Known secret leak:** `application.properties` line for `grok.api.key` is a **literal hardcoded value**, not `${GROQ_API_KEY}` — confirmed still present as of this briefing (2026-07-03). `spring.datasource.password` also has an insecure literal fallback pattern (`${DB_PASSWORD:1234}`).
- `IPdfService`/`PdfServiceImpl` (`POST /api/pdf/summarize`) is a separate, simpler summarization flow — not detailed above but follows the same WebClient-to-Ollama pattern.

---

## 4. Frontend architecture

Base: `frontend/src/`.

```
api/              axios.ts (instance+interceptors), auth.api.ts, session.api.ts, code.api.ts, pdf.api.ts, quiz.api.ts
components/       ProtectedRoute.tsx
components/layout/  Layout.tsx, Sidebar.tsx, Topbar.tsx
components/ui/    Badge, Button, Card, EmptyState, Modal, Skeleton, Toast (design-system primitives)
context/          AuthContext.tsx, ThemeContext.tsx
hooks/            useAuth.ts, useTheme.ts (thin wrappers around the contexts)
pages/            one file per route (see routing below)
types/index.ts    all shared TS types/interfaces
App.tsx, main.tsx
```

### Routing (`App.tsx`)
Uses `react-router-dom` v6 nested routes. Public: `/login`, `/register`. Everything else is wrapped in `<ProtectedRoute><Layout /></ProtectedRoute>` with role-gated sub-routes:
- `/` → redirects to role home (`/professor/dashboard`, `/admin/dashboard`, or `/student/dashboard`)
- `code-editor`, `pdf-simplifier` — any authenticated role
- `admin/dashboard` — ADMIN only
- `professor/dashboard`, `professor/session/:id`, `professor/session/:id/quiz/create` — PROF only
- `student/dashboard`, `student/session/:id` — STUDENT only
- `*` → redirect to `/`

**Important gap (confirmed by reading the code directly):** `frontend/src/pages/StudentQuiz.tsx` and `frontend/src/pages/QuizResults.tsx` are fully implemented components but are **never imported in `App.tsx`** and have **no route defined**. Yet `StudentSession.tsx` actively `navigate()`s to `/student/session/${sessionId}/quiz` (to start the quiz) and to `/student/session/${sessionId}/quiz/results` (to view results) when in QUIZ mode — both of these URLs currently 404 through the `*` catch-all (silently redirecting to `/`). **This breaks the entire student quiz-taking flow in the deployed UI.** Fix: add two routes in `App.tsx` under the `student/session/:id` group:
```tsx
<Route path="student/session/:id/quiz" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentQuiz /></ProtectedRoute>} />
<Route path="student/session/:id/quiz/results" element={<ProtectedRoute allowedRoles={['STUDENT']}><QuizResults /></ProtectedRoute>} />
```

### State management
No Redux/Zustand — just two React Contexts:
- `AuthContext` (`context/AuthContext.tsx`) — holds `currentUser: UserResponse | null`, `token`, `isLoading`; hydrates from `localStorage` keys `ss_token` / `ss_user` on mount; `login(res: AuthResponse)` and `logout()` write/clear those same keys. Consumed via `useAuth()` hook.
- `ThemeContext` (`context/ThemeContext.tsx`) — `theme: 'dark'|'light'`, persisted to `localStorage.ss_theme`, toggles a `dark` class on `document.documentElement`. Consumed via `useTheme()`.
- Everything else is local component state (`useState`/`useEffect`), with manual polling (`setInterval`) for "live" leaderboard/submission views — no websockets.

### API layer (`src/api/`)
Thin per-domain wrapper modules around a single shared `axios` instance (`axios.ts`):
- `axios.ts` — baseURL `/api`, 30s timeout, request interceptor attaches `Authorization: Bearer <ss_token>`, response interceptor clears storage + hard-redirects to `/login` on any 401.
- `auth.api.ts` — `login`, `register`, `getMe` (`GET /users/me`), `updateMe` (`PUT /users/me`).
- `session.api.ts` — `sessionApi.{create, getMySessions, getMyStudentSessions, getById, join, close, submitCode, getSubmissions, duplicateSession}`; also exports `adminApi.{getUsers, deleteUser}`.
- `code.api.ts` — `codeApi.execute`.
- `pdf.api.ts` — `pdfApi.summarize` (120s timeout — AI can be slow).
- `quiz.api.ts` — `quizApi.{createQuiz, generateFromPdf, getQuiz, submitAnswers, getLeaderboard, getAttempts}`. `generateFromPdf` sends non-file params as **URL query params** (not multipart fields) alongside a multipart `file` field, matching the backend's `@RequestParam` + `@RequestPart` split.

### Shared types (`src/types/index.ts`)
Single file, grouped by domain (Auth, Sessions, Code Execution, PDF, Quiz, UI). Notable: `Role`, `SessionStatus`, `SessionType` (`'CODE'|'QUIZ'`), `Language` (6 values with an icon/color lookup table `LANG_META`), and the full quiz type set (`CreateQuizRequest`, `QuizResponse`, `QuestionResponse`, `SubmitQuizAnswersRequest`, `QuizAttemptResponse`, `LeaderboardResponse`, etc.) — these line up 1:1 with the backend quiz DTOs (see §7).

---

## 5. Data model

### Entities (all under `Model/Entity/` except `ExecutionResult`, which lives directly under `Model/`)

| Entity | Table | Key fields | Relationships |
|---|---|---|---|
| `User` | `users` | id, fullName, email (unique), password (BCrypt), role (`RoleEnum`), plan (`PlanEnum`), stripCustomerId, createdAt, updatedAt | — |
| `Session` | `sessions` | id, title, joinCode (unique, 6 chars), status (`OPEN`/`CLOSED`), language, exercisePrompt, filiere, sessionType (`CODE`/`QUIZ`, plain string not enum), createdAt/updatedAt | `ManyToOne` → prof (`User`); `ManyToMany` → students (`User`) via join table `session_students` |
| `Quiz` | `quizzes` | id, title, description, timeLimitMinutes, createdAt | `OneToOne` → `Session` (unique FK `session_id` — **one quiz per session, max**); `OneToMany` → `Question` (cascade ALL, orphanRemoval, ordered by `position`) |
| `Question` | `questions` | id, questionText, optionA-D, correctOption (CHAR(1)), position | `ManyToOne` → `Quiz` |
| `QuizAttempt` | `quiz_attempts` | id, score, totalQuestions, percentage (`DECIMAL(5,2)`), completedAt | `ManyToOne` → `Quiz`, `ManyToOne` → `User` (student); `OneToMany` → `StudentAnswer` (cascade ALL). **Unique constraint `(quiz_id, student_id)`** — attempts are upserted, not appended, so re-submitting overwrites the previous score. |
| `StudentAnswer` | `student_answers` | id, selectedOption (CHAR(1)), isCorrect | `ManyToOne` → `QuizAttempt`, `ManyToOne` → `Question` |
| `StudentSubmission` | `student_submissions` | id, code, stdout, stderr, exitCode, executionTimeMs, status (`SubmissionStatus`), submittedAt | `ManyToOne` → `Session`, `ManyToOne` → `User` (student). **Unique constraint `(student_id, session_id)`** — one row per student per session, upserted on re-submit (like `StudentSubmission`, this is CODE-session-only; `StudentSubmission` is not used for quiz sessions). |
| `ExecutionResult` | `execution_results` | id, language, code, output, error, executionTimeMs, status (`SUCCESS`/`ERROR`/`TIMEOUT`), createdAt | `ManyToOne` → `User` (LAZY — never serialized directly, only via `ExecutionResultResponse`) |
| `PdfSummary` | `pdf_summaries` | id, fileName, pageCount, originalText (TEXT, capped ~60k chars), summary, createdAt | `ManyToOne` → `User` (LAZY) |
| `PdfSummaryLog` | *(none — deprecated, no `@Entity`)* | — | dead class, safe to delete |

Enums: `RoleEnum = ADMIN | PROF | STUDENT`; `PlanEnum = FREE | PRO | ENTERPRISE` (memory note: DB default plan on register is `FREE`); `SessionStatus = OPEN | CLOSED`; `SubmissionStatus = PENDING | SUCCESS | ERROR | TIMEOUT`.

### Flyway migrations (`backend/src/main/resources/db/migration/`)
- `V1__create_tables.sql` — `users` table.
- `V2__add_roles.sql` — widens `role`/`plan` to `VARCHAR(50) NOT NULL`.
- `V3__add_missing_user_columns.sql` — adds `updated_at`, `strip_customer_id` to `users`.
- `V4__create_session.sql` — `sessions` + `session_students` join table + indexes.
- `V5__add_missing_tables.sql` — adds `execution_results`, `pdf_summaries`, and an unused `notifications` table (no `Notification` entity exists in the codebase — dead table).
- `V6__add_pdf_summary_original_text.sql` — adds `pdf_summaries.original_text`.
- `V7__add_session_exercise_fields.sql` — adds `sessions.language/exercise_prompt/filiere`; creates `student_submissions`.
- `V8__add_quiz_tables.sql` — **drops and recreates** `quizzes`/`questions`/`quiz_attempts`/`student_answers` (an earlier Hibernate-auto-generated schema was wrong and is discarded here) and adds `sessions.session_type`.

Config: `spring.jpa.hibernate.ddl-auto=validate` (Flyway is the sole schema authority; Hibernate only validates). `spring.flyway.baseline-on-migrate=true`, `baseline-version=4`, `out-of-order=true`, `validate-on-migrate=false`.

---

## 6. Full API contract

All paths are prefixed `/api`. Auth column shows the Spring Security rule; DTOs are as documented above.

### Auth (`AuthController`, `/api/auth`) — public
| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/auth/login` | `LoginRequest{email,password}` | `JwtResponse{token,id,fullName,email,role,plan}` | public |
| POST | `/auth/register` | `RegisterRequest{fullName,email,password,role}` | `JwtResponse` (201) | public — role ADMIN rejected |

### Users (`UserController`, `/api/users`)
| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| GET | `/users/me` | — | `UserProfileResponse{id,fullName,email,role,plan,createdAt}` | authenticated |
| PUT | `/users/me` | `UpdateProfileRequest{fullName?,currentPassword?,newPassword?}` | `UserProfileResponse` | authenticated |
| GET | `/users` | — | `UserProfileResponse[]` | ADMIN |
| DELETE | `/users/{id}` | — | 204 | ADMIN |

### Admin (`AdminController`, `/api/admin`)
| Method | Path | Response | Auth |
|---|---|---|---|
| GET | `/admin/stats` | `AdminStatsResponse{totalUsers,totalSessions,totalExecutions,totalPdfSummaries}` | ADMIN |

### Sessions (`SessionController`, `/api/sessions`)
| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/sessions/create` | `CreateSessionRequest{title,sessionType?,language?,exercisePrompt?,filiere?}` | `SessionResponse` (201) | PROF |
| GET | `/sessions/my` | — | `SessionResponse[]` | PROF |
| GET | `/sessions/my/student` | — | `SessionResponse[]` | STUDENT |
| POST | `/sessions/join/{code}` | — | `SessionResponse` | STUDENT |
| GET | `/sessions/{id}` | — | `SessionResponse` | any authenticated (no ownership check) |
| PUT | `/sessions/{id}/close` | — | `SessionResponse` | PROF (ownership verified in service) |
| POST | `/sessions/{id}/submit` | `SubmitCodeRequest{code,language?,stdin?}` | `StudentSubmissionResponse` | STUDENT |
| GET | `/sessions/{id}/submissions` | — | `StudentSubmissionResponse[]` | PROF (ownership verified) |
| POST | `/sessions/{id}/duplicate` | `DuplicateSessionRequest{title?,filiere?}` (optional body) | `SessionResponse` (201) | PROF (ownership verified) |

`SessionResponse`: `{id, title, joinCode, status, profName, studentCount, language, exercisePrompt, filiere, sessionType, hasQuiz, createdAt}`.

### Quiz (`QuizController`, `/api/sessions/{sessionId}/quiz`) — fully implemented on the backend
| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/quiz/create` | `CreateQuizRequest{title,description?,timeLimitMinutes,questions:[CreateQuestionRequest]}` | `QuizResponse` (201) | PROF, session owner, session must be `sessionType=QUIZ`, only if no quiz exists yet |
| POST | `/quiz/generate-from-pdf` | multipart `file` + query params `numberOfQuestions` (1-20), `title`, `description?` | `QuizResponse` (201) | PROF, same guards as above |
| GET | `/quiz` | — | `QuizResponse` (PROF sees `correctOption` per question via `QuestionWithAnswerResponse`; STUDENT does not) | any authenticated (⚠ no membership check for students) |
| POST | `/quiz/submit` | `SubmitQuizAnswersRequest{answers:[{questionId,selectedOption}]}` | `QuizAttemptResponse` | STUDENT (⚠ no membership check; upserts on resubmit) |
| GET | `/quiz/leaderboard` | — | `LeaderboardResponse{entries:[LeaderboardEntry],totalStudents,completedCount}` | any authenticated (⚠ no membership check) |
| GET | `/quiz/attempts` | — | `QuizAttemptResponse[]` | PROF, session owner |

`QuestionResponse` (student view): `{id,questionText,optionA-D,position}` — `correctOption` omitted.
`QuizAttemptResponse`: `{id,studentId,studentName,studentEmail,score,totalQuestions,percentage,answers:[StudentAnswerResult],completedAt}`.
`StudentAnswerResult`: `{questionId,questionText,selectedOption,correctOption,isCorrect}`.

### Code execution (`CodeExecutionController`, `ExecutionHistoryController`, `/api/code`)
| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/code/execute` | `CodeRequest{code,language,stdin?}` | `CodeResponse{success,output,error,executionTimeMs,status,language,exitCode}` — **no `id`** | STUDENT or PROF |
| GET | `/code/history` | — | `ExecutionResultResponse[]` (newest first; `code` field truncated to 200 chars) | STUDENT or PROF |

### AI (`AiController`, `/api/ai`)
| Method | Path | Response | Auth |
|---|---|---|---|
| GET | `/ai/analyze/{executionId}` | `AiAnalysisResponse{executionId,language,code,error,analysis}` | authenticated |

Frontend note: `StudentSession.tsx`'s `handleAiAnalyze` actually calls `POST /api/ai/analyze` with a JSON body via raw `fetch` (not the axios client, not the documented `GET /api/ai/analyze/{executionId}`) — this is a **mismatch between frontend and backend**: the backend has no `POST /api/ai/analyze` handler, so this call will 404/405 in practice. The only working AI-analysis path is `GET /api/ai/analyze/{executionId}`, which requires the frontend to have already fetched `/api/code/history` to learn the newest execution's id.

### PDF (`PdfController`, `/api/pdf`)
| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/pdf/summarize` | multipart `file` | `SummaryResponse{summary,fileName,pageCount}` | authenticated |
| GET | `/pdf/history` | — | `PdfSummaryResponse[]{id,fileName,summary,createdAt}` | authenticated |

---

## 7. The quiz feature — frontend vs backend in detail

### Backend: fully implemented
`QuizController` + `IQuizService`/`QuizServiceImpl` + entities `Quiz`/`Question`/`QuizAttempt`/`StudentAnswer` + repositories all exist and are wired up (see §6 for the full endpoint table). This **contradicts** any documentation (`ENDPOINT_INVENTORY.md`, dated 2026-05-31) that claims quiz endpoints don't exist — that doc is simply stale; the actual `QuizController.java` has all 6 routes.

Business rules enforced server-side (`QuizServiceImpl`):
- A session must have `sessionType == "QUIZ"` before a quiz can be created on it (`verifyQuizType`).
- Only one quiz per session (`quizzes.session_id` has a UNIQUE constraint; `verifyNoExistingQuiz` throws `BadRequestException` if one already exists — there is **no update/edit-quiz endpoint**, only create).
- Only the owning PROF can create a quiz or view `/quiz/attempts` (`verifyProfOwnership`).
- Closed sessions reject new quiz submissions (`BadRequestException`).
- Submitting is an upsert keyed on `(quiz_id, student_id)` — retaking a quiz overwrites the previous attempt/score (old answers are cleared and replaced).
- AI-generated quizzes (`generateQuizFromPdf`) extract PDF text via PDFBox, truncate to 12,000 chars, prompt the DeepSeek/Ollama endpoint for strict JSON, strip `<think>` blocks, and parse into questions — capped at 20 questions.
- `duplicateQuiz(originalSessionId, newSessionId)` is called internally by `SessionServiceImpl.duplicateSession` when duplicating a QUIZ-type session that already has a quiz — copies all questions with fresh IDs into the new quiz.
- **Security gap** (repeated from §3): `getQuizForStudent`, `submitAnswers`, `getLeaderboard` do not verify the calling student is in `session.getStudents()` — only that the user exists and (for submit) the session is open.

### Frontend: fully built, but not fully wired into routing
- **`StudentQuiz.tsx`** (`src/pages/StudentQuiz.tsx`) — the quiz-taking UI. Loads the quiz via `quizApi.getQuiz`, shows one question at a time with progress bar, tracks a per-second countdown if `timeLimitMinutes > 0` with auto-submit at zero, confirms before final submit, calls `quizApi.submitAnswers`, then `navigate('/student/session/:id/quiz/results', {state:{result}})` and also persists the result to `sessionStorage` as a fallback (`quiz_result_${sessionId}`).
- **`QuizResults.tsx`** (`src/pages/QuizResults.tsx`) — score ring, per-question correct/incorrect breakdown, live leaderboard table (fetched via `quizApi.getLeaderboard`). Reads the attempt from router state or `sessionStorage` fallback; if neither is present, redirects to `/student/dashboard`.
- **`QuizCreator.tsx`** (`src/pages/QuizCreator.tsx`, routed at `professor/session/:id/quiz/create`) — two-panel UI: left panel drag-and-drops a PDF and calls `quizApi.generateFromPdf`; right panel is a manual question editor (add/remove/reorder/set-correct-option) that calls `quizApi.createQuiz` on save. This one **is** correctly routed.
- **`ProfessorSession.tsx`**'s embedded `QuizTabPanel` — tabbed view (Live Leaderboard / Detailed Results / Quiz Preview) for the prof, polls `quizApi.getLeaderboard` every 5s and `quizApi.getAttempts` every 10s while the session is `OPEN`.
- **`StudentSession.tsx`** — when `session.sessionType === 'QUIZ'`, renders a quiz-info card (title, question count, time limit) and, depending on state, either a "Commencer le quiz →" button (`navigate` to `/student/session/:id/quiz`) or, if already attempted, a "Voir mes résultats →" button (`navigate` to `/student/session/:id/quiz/results`).

### The gap — confirmed by reading `App.tsx` directly
`App.tsx` imports and routes `QuizCreator` but **does not import or route `StudentQuiz` or `QuizResults` at all**. The routes it navigates to (`student/session/:id/quiz` and `student/session/:id/quiz/results`) do not exist in the router; they fall through to the `<Route path="*" element={<Navigate to="/" replace />} />` catch-all. **Net effect: a student can see the "Commencer le quiz" button and click it, but is silently bounced back to their dashboard instead of reaching the quiz.** This is a routing omission, not a missing backend or missing component — the fix is purely adding two `<Route>` entries in `App.tsx` (see exact patch in §4).

No other quiz endpoint is called by the frontend that the backend lacks — the `quiz.api.ts` methods map 1:1 onto `QuizController`'s six endpoints.

---

## 8. Conventions to follow when adding backend code

- **Package layout**: put new request/response DTOs under `DTO/Request` / `DTO/Response` respectively — never inline records in controllers. Response DTOs are Lombok `@Data`/`@Getter+@Setter` + `@Builder` + `@NoArgsConstructor` + `@AllArgsConstructor`; Request DTOs use `@Getter/@Setter` (not `@Data`) with Jakarta Validation annotations (`@NotBlank`, `@Email`, `@Size`, `@NotNull`, `@NotEmpty`, `@Valid` for nested lists) carrying French user-facing messages.
- **Entities**: Lombok `@Getter/@Setter` (or `@Data`) + `@Builder` + `@NoArgsConstructor` + `@AllArgsConstructor`; use `@Builder.Default` for any field with a non-null default; timestamps via `@CreationTimestamp`/`@UpdateTimestamp` (Hibernate-managed) rather than manual `@PrePersist`, except `User` which still hand-rolls `@PrePersist`/`@PreUpdate` (legacy pattern, don't copy it for new entities — prefer the Hibernate annotations like `Session`/`Quiz`/etc. do).
- **Never expose entities directly as JSON** — always map to a Response DTO, especially for entities with `LAZY` `User` relations (`ExecutionResult`, `PdfSummary`) to avoid `LazyInitializationException` and password leakage. Mapping is done by hand in service `toXResponse` private methods, not via MapStruct (only `UserMapper` exists and is barely used).
- **Services**: interface named `IXxxService` (or the historical typo `IAuthServicelmpl` — don't repeat that typo in new code, but don't "fix" it either without checking all call sites) in `Service/`, implementation `XxxServiceImpl` in `Service/Impl/`. Ownership/role checks (e.g. `verifyProfOwnership`) live as private helper methods inside the service impl, called explicitly at the top of each public method — not handled via `@PreAuthorize`. Follow this pattern for new services rather than introducing method-level security annotations.
- **Exceptions**: throw `BadRequestException` (400), `ResourceNotFoundException` (404), `ForbiddenException` (403), or `UnauthrizedException` (401, note the typo — matches an existing class) — all extend `ApiException(message, HttpStatus)` and are caught generically by `GlobalExceptionHandler.handleApiException`. There's also a duplicate `RessourceNotFoundException` (typo'd) alongside the correctly-spelled `ResourceNotFoundException` — check which one is actually thrown before reusing; prefer `ResourceNotFoundException`. Error messages are user-facing French strings.
- **Controllers**: package is lowercase `controller` (inconsistent with the rest, which is TitleCase — keep new controllers in the same lowercase package for consistency with existing code, don't create a new `Controller/` package). Use `@RequiredArgsConstructor` + constructor injection, `@AuthenticationPrincipal UserDetails userDetails` to get the caller (email = `userDetails.getUsername()`), explicit `@PathVariable`/`@RequestBody @Valid`/`@RequestParam`, and return `ResponseEntity<T>` with the correct status (`201` for creates via `.status(HttpStatus.CREATED)`).
- **Authorization double-layer**: URL-pattern rules in `SecurityConfig` are coarse (role-only); fine-grained ownership checks (e.g. "is this prof's session") happen inside the service layer. When adding a new endpoint, add both: a `SecurityConfig` rule for the role, and an explicit ownership/membership check in the service if the resource is scoped to a specific user.
- **Config/env vars**: `application.properties` uses `${ENV_VAR:default}` Spring placeholder syntax for deployment-configurable values (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SERVER_PORT`) — **follow this pattern for any new secret or environment-dependent value**; do not hardcode literals (the `grok.api.key` literal is a known anti-pattern to avoid repeating, not a model to copy).
- **Migrations**: new schema changes go in a new `V{n}__description.sql` file in `db/migration/`, never edit an existing migration. Flyway is the sole schema authority (`ddl-auto=validate`) — a new/changed entity field requires both the Java change and a matching migration, or the app fails to start (Hibernate validation mismatch).
- **Frontend**: one `xxx.api.ts` module per backend feature area under `src/api/`, all thin wrappers returning `.then(r => r.data)` around the shared `axios` instance — add a new file here rather than inlining `axios` calls in a page component. Shared types go in the single `src/types/index.ts` file, grouped by domain with a `// ─── Section ─── ` comment banner — mirror the backend request/response DTO field names exactly (they currently match 1:1 for every feature). New protected pages must be registered in `App.tsx` inside the appropriate role-gated `<Route>` block, or they will be unreachable despite existing (see §7's quiz-routing bug for what happens when this step is skipped).
