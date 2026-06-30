# SmartStudy — Inventaire complet des endpoints

> Généré par audit statique — 2026-05-31

| # | Method | Path | Auth Required | Roles Allowed | Request Body (DTO) | Response Body (DTO) | Status Codes |
|---|--------|------|---------------|---------------|--------------------|---------------------|--------------|
| 1 | POST | `/api/auth/register` | Non | Public | `RegisterRequest` (fullName, email, password, role) | `JwtResponse` (token, id, fullName, email, role, plan) | 201, 400 |
| 2 | POST | `/api/auth/login` | Non | Public | `LoginRequest` (email, password) | `JwtResponse` | 200, 400, 401 |
| 3 | GET | `/api/users/me` | Oui | ADMIN, PROF, STUDENT | — | `UserProfileResponse` (id, fullName, email, role, plan, createdAt) | 200, 401 |
| 4 | PUT | `/api/users/me` | Oui | ADMIN, PROF, STUDENT | `UpdateProfileRequest` (fullName?, currentPassword?, newPassword?) | `UserProfileResponse` | 200, 400, 401 |
| 5 | GET | `/api/users` | Oui | ADMIN | — | `List<UserProfileResponse>` | 200, 401, 403 |
| 6 | DELETE | `/api/users/{id}` | Oui | ADMIN | — | vide | 204, 401, 403, 404 |
| 7 | POST | `/api/sessions/create` | Oui | PROF | `CreateSessionRequest` (title) | `SessionResponse` (id, title, joinCode, status, profName, studentCount, createdAt) | 201, 400, 401, 403 |
| 8 | GET | `/api/sessions/my` | Oui | PROF | — | `List<SessionResponse>` | 200, 401, 403 |
| 9 | POST | `/api/sessions/join/{code}` | Oui | STUDENT | — (code dans l'URL) | `SessionResponse` | 200, 400, 401, 403, 404 |
| 10 | GET | `/api/sessions/{id}` | Oui | ADMIN, PROF, STUDENT | — | `SessionResponse` | 200, 401, 404 |
| 11 | PUT | `/api/sessions/{id}/close` | Oui | PROF (propriétaire) | — | `SessionResponse` (status=CLOSED) | 200, 400, 401, 403, 404 |
| 12 | POST | `/api/code/execute` | Oui | PROF, STUDENT | `CodeRequest` (code, language, stdin?) | `CodeResponse` (success, output, error, status, language, exitCode, executionTimeMs) | 200, 400, 401, 403 |
| 13 | GET | `/api/code/history` | Oui | PROF, STUDENT | — | `List<ExecutionResultResponse>` (id, language, code[200c], stdout, stderr, exitCode, executionTimeMs, createdAt) | 200, 401, 403 |
| 14 | POST | `/api/pdf/summarize` | Oui | ADMIN, PROF, STUDENT | `multipart/form-data` champ `file` (PDF, max 50 Mo) | `SummaryResponse` (summary, fileName, pageCount) | 200, 400, 401, 500 |
| 15 | GET | `/api/pdf/history` | Oui | ADMIN, PROF, STUDENT | — | `List<PdfSummaryResponse>` (id, fileName, summary, createdAt) | 200, 401 |
| 16 | GET | `/api/admin/stats` | Oui | ADMIN | — | `AdminStatsResponse` (totalUsers, totalSessions, totalExecutions, totalPdfSummaries) | 200, 401, 403 |
| 17 | GET | `/api/ai/analyze/{executionId}` | Oui | ADMIN, PROF, STUDENT | — | `AiAnalysisResponse` (executionId, language, code, error, analysis) | 200, 401, 404 |

## Notes

- **Endpoint 9 :** le code de session est un **path variable** (`/join/{code}`), pas un request body.
- **Endpoint 12 :** les erreurs d'exécution (syntaxe, runtime, timeout) retournent toujours **HTTP 200** — l'échec est indiqué par `success: false` et `status: "ERROR"|"TIMEOUT"`.
- **Endpoint 7 :** chemin réel `/api/sessions/create` (pas `/api/sessions`).
- **Endpoint 8 :** chemin réel `/api/sessions/my` (pas `/api/sessions`).
- **ADMIN** ne peut pas s'inscrire via l'API — le compte doit être créé directement en base.
- Il n'existe pas d'endpoint `/api/prof/**` malgré la règle de sécurité déclarée dans `SecurityConfig`.
