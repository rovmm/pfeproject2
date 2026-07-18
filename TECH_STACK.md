# SmartStudy — Technology Stack

Reference for the PFE report's technical chapter. Extracted from `backend/pom.xml`, `frontend/package.json`, and `DockerSandboxService.java`.

## Backend — Java / Spring Boot (`backend/pom.xml`)

| Technology | Version | Purpose | Used in |
|---|---|---|---|
| Java | 17 | Core language, compile/runtime target | Entire backend |
| Spring Boot (parent) | 3.5.6 | Application framework / auto-configuration | Entire backend |
| spring-boot-starter-webflux | (managed by 3.5.6) | Reactive HTTP client (used for calling Groq/Mistral AI APIs) | AI service clients |
| spring-boot-starter-actuator | (managed) | Health checks / monitoring endpoints | Ops/monitoring |
| spring-boot-starter-data-jpa | (managed) | ORM / repository layer over MySQL | Entities, Repositories |
| spring-boot-starter-security | (managed) | Authentication, authorization, JWT filter chain | `SecurityConfig`, Auth |
| spring-boot-starter-web | (managed) | REST controllers (Spring MVC) | All `Controller` classes |
| spring-boot-starter-mail | (managed) | SMTP email sending (Gmail) | Account verification/reset emails |
| spring-boot-starter-validation | 3.5.6 | Bean validation (`@Valid`, DTO constraints) | Request DTOs |
| spring-boot-devtools | (managed, runtime/optional) | Hot reload during development | Dev environment only |
| spring-dotenv (me.paulschwarz) | 4.0.0 | Loads `.env` file into Spring environment | App bootstrap/config |
| flyway-core | (managed) | Database schema migrations | `db/migration` |
| flyway-mysql | (managed) | MySQL-specific Flyway support | `db/migration` |
| spring-ai-tika-document-reader | 1.0.3 | Extracts text from documents (PDF parsing pipeline) | PDF summary/quiz generation |
| mysql-connector-j | (managed, runtime) | JDBC driver for MySQL | Datasource |
| lombok | (managed, optional) | Boilerplate reduction (getters/setters/builders) | Entities, DTOs, Services |
| spring-boot-starter-test | (managed, test) | JUnit 5 + Spring test utilities | Test suite |
| spring-security-test | (managed, test) | Security-context test helpers | Test suite |
| jjwt-api | 0.11.5 | JWT creation/parsing API | JWT auth |
| jjwt-impl | 0.11.5 (runtime) | JWT implementation | JWT auth |
| jjwt-jackson | 0.11.5 (runtime) | Jackson (de)serializer for JWT claims | JWT auth |
| pdfbox (org.apache.pdfbox) | 2.0.29 | PDF text/metadata extraction | PDF summarization feature |
| docker-java-core (com.github.docker-java) | 3.3.4 | Docker Engine API client (create/run containers) | `DockerSandboxService` — code execution sandbox |
| docker-java-transport-okhttp | 3.3.4 | OkHttp transport for Docker client | `DockerSandboxService` |
| maven-compiler-plugin | (managed) | Compiles Java 17 source with Lombok annotation processing | Build |
| spring-boot-maven-plugin | (managed) | Packages executable JAR | Build/packaging |

## Frontend — React (`frontend/package.json`)

| Technology | Version | Purpose | Used in |
|---|---|---|---|
| react | ^19.2.7 | UI library | Entire frontend |
| react-dom | ^19.2.7 | DOM rendering for React | Entire frontend |
| react-router-dom | ^7.18.1 | Client-side routing | Page navigation |
| axios | ^1.6.0 | HTTP client for REST API calls to backend | `src/api/*` |
| framer-motion | ^12.42.2 | Animations/transitions | UI components |
| @monaco-editor/react | ^4.7.0 | Code editor React wrapper | Code execution / quiz code editor |
| monaco-editor | ^0.55.1 | Underlying VS Code editor engine | Code execution / quiz code editor |
| typescript | ~6.0.2 | Static typing (dev) | Entire frontend |
| vite | ^8.1.1 | Dev server / build tool | Build tooling |
| @vitejs/plugin-react | ^6.0.3 | React fast-refresh plugin for Vite | Build tooling |
| oxlint | ^1.71.0 | Linter | Code quality (dev) |
| @types/node | ^24.13.2 | Node type definitions (dev) | TypeScript tooling |
| @types/react | ^19.2.17 | React type definitions (dev) | TypeScript tooling |
| @types/react-dom | ^19.2.3 | React-DOM type definitions (dev) | TypeScript tooling |

## Runtime / Infrastructure

| Technology | Version | Purpose | Used in |
|---|---|---|---|
| Node.js | v20.19.0 (local dev env) | Frontend build/dev runtime | `frontend/` |
| npm | 10.8.2 (local dev env) | Package manager | `frontend/` |
| MySQL | 8.0.46 (local dev env; app connects via `jdbc:mysql://localhost:3306/Quiz`) | Primary relational database | `backend/`, Flyway migrations |
| Docker Engine | 29.1.3 (local dev env) | Container runtime hosting the code-execution sandbox | `DockerSandboxService` |

> Note: MySQL, Docker Engine, and Node.js versions above are what's installed on this local machine — the project pins no explicit version requirement for them (no `.nvmrc`, `docker-compose.yml`, or MySQL version constraint found in the repo). Treat these as *validated development versions*, not hard requirements.

## Docker Sandbox Images (code execution feature — `DockerSandboxService.java`)

| Image | Version/Tag | Purpose |
|---|---|---|
| python | 3.12-alpine | Executes submitted Python code |
| node | 20-alpine | Executes submitted JavaScript code |
| smartstudy-ts (custom, built from node:20-alpine) | latest | Executes submitted TypeScript code (transpiled via ts-node) |
| eclipse-temurin | 21-jdk-alpine | Executes submitted Java code |
| gcc | 13 | Compiles/executes submitted C++ code |
| php | 8.3-alpine | Executes submitted PHP code |

## External APIs Called

| API | Purpose | Configuration |
|---|---|---|
| Groq Cloud (OpenAI-compatible) | LLM inference — PDF summarization, code analysis, AI quiz generation. Model: `llama-3.3-70b-versatile` | `grok.api.url` / `GROK_API_KEY` in `application.properties` |
| Vision API via Open WebUI (Mistral model) | Image understanding for Drive-uploaded images only | `vision.api.url` / `VISION_API_KEY` in `application.properties` |
| Gmail SMTP (`smtp.gmail.com:587`) | Transactional email (verification, password reset) | `spring.mail.*` properties |
| Docker Engine API (local Unix socket `/var/run/docker.sock`) | Isolated code execution sandbox | `docker.socket.path` |
