# SmartStudy Backend — Documentation technique

> Généré par audit statique du code source — Spring Boot 3.x / Java 21

---

## 1. Architecture générale

```
src/main/java/com/example/quizplatforme/
├── Config/               Configuration transversale (Spring Security, JWT, CORS, gestion globale des erreurs)
├── controller/           Couche REST — reçoit les requêtes HTTP, délègue aux services
├── DTO/
│   ├── Request/          Objets de requête (validation Jakarta Bean Validation)
│   └── Response/         Objets de réponse (jamais les entités directement)
├── Model/
│   ├── Entity/           Entités JPA (User, Session, PdfSummary, PdfSummaryLog)
│   ├── Enum/             Énumérations (RoleEnum, PlanEnum, SessionStatus)
│   └── ExecutionResult   Entité des résultats d'exécution de code
├── Repository/           Interfaces Spring Data JPA
├── Service/              Interfaces de service
│   └── Impl/             Implémentations de service
│       ├── AuthServiceImpl           Authentification / inscription
│       ├── UserServiceImpl           Profil utilisateur, admin stats
│       ├── SessionServiceImpl        Gestion des sessions de cours
│       ├── CodeExecutionServiceImpl  Orchestration exécution de code
│       ├── DockerSandboxService      Exécution isolée via Docker
│       ├── PdfServiceImpl            Résumé PDF via Grok AI
│       ├── GrokServiceImpl         Client API Grok (analyse + résumé)
│       └── DeepSeekServiceImpl       Client API DeepSeek (non utilisé en prod)
├── exception/            Hiérarchie d'exceptions métier (ApiException et sous-classes)
├── payload/              ErrorResponse uniforme
└── mapper/               UserMapper (entité → DTO)
```

**Base de données :** MySQL 8, migrations Flyway (`src/main/resources/db/migration`)  
**Auth :** JWT HMAC-SHA256 (jjwt), stateless (pas de session HTTP)  
**AI :** Grok API (modèle llama) pour résumé PDF et analyse de code  
**Sandbox :** Docker Engine via `docker-java` — chaque exécution dans un conteneur éphémère  

---

## 2. Flux d'authentification JWT

```
Client                      AuthController              AuthServiceImpl          JwtTokenProvider
  │                              │                            │                        │
  │── POST /api/auth/register ──▶│                            │                        │
  │       {fullName, email,      │── register(request) ──────▶│                        │
  │        password, role}       │                            │── save(user) ──▶ DB    │
  │                              │                            │── generateToken ───────▶│
  │                              │                            │◀── JWT (HS256) ─────────│
  │◀── 201 {token, id, email,   │◀── JwtResponse ────────────│                        │
  │         fullName, role, plan}│                            │                        │
  │                              │                            │                        │
  │── POST /api/auth/login ─────▶│                            │                        │
  │       {email, password}      │── login(request) ─────────▶│                        │
  │                              │                            │── AuthenticationManager│
  │                              │                            │   (BCrypt compare) ──▶ │
  │                              │                            │── generateToken ───────▶│
  │◀── 200 {token, ...}         │◀── JwtResponse ────────────│                        │

Toute requête protégée :
  │── GET /api/... ─────────────▶│
  │   Authorization: Bearer <jwt>│
  │                              │── JwtAuthenticationFilter
  │                              │   1. Extraire token du header
  │                              │   2. jwtProvider.validateToken()
  │                              │   3. getEmailFromToken()
  │                              │   4. userDetailsService.loadUserByUsername(email)
  │                              │   5. SecurityContextHolder.setAuthentication(...)
  │                              │── Controller traite la requête
  │◀── 200 / 4xx ───────────────│
```

**Durée du token :** 86 400 000 ms = 24 heures (configurable via `jwt.expiration`)  
**Algorithme :** HS256 — clé symétrique injectée depuis `JWT_SECRET` (env var)  
**Subject :** email de l'utilisateur  
**Refresh token :** non implémenté — le client doit se reconnecter après expiration  

---

## 3. Inventaire complet des endpoints

### 3.1 Auth — `/api/auth/**` (public)

#### POST /api/auth/register
- **Description :** Crée un compte PROF ou STUDENT et retourne un JWT (auto-login).
- **Auth :** Aucune
- **Rôles :** Public
- **Request body :**
```json
{
  "fullName":  "Yassine Benali",           // string, obligatoire, max 100 car.
  "email":     "yassine@smartstudy.ma",    // string, format email, obligatoire
  "password":  "Azerty1234!",              // string, 8–100 car., obligatoire
  "role":      "STUDENT"                   // enum: PROF | STUDENT (ADMIN interdit)
}
```
- **Response 201 :**
```json
{
  "token":    "eyJhbGciOiJIUzI1NiJ9...",
  "id":       1,
  "fullName": "Yassine Benali",
  "email":    "yassine@smartstudy.ma",
  "role":     "STUDENT",
  "plan":     "FREE"
}
```
- **Erreurs :**

| Code | Message |
|------|---------|
| 400 | `"Cette adresse e-mail est déjà utilisée."` |
| 400 | `"L'inscription en tant qu'administrateur n'est pas autorisée."` |
| 400 | `"La requête contient des champs invalides."` (+ map des erreurs par champ) |

---

#### POST /api/auth/login
- **Description :** Authentifie un utilisateur existant, retourne un JWT.
- **Auth :** Aucune
- **Request body :**
```json
{
  "email":    "yassine@smartstudy.ma",
  "password": "Azerty1234!"
}
```
- **Response 200 :** même structure que `/register`
- **Erreurs :**

| Code | Message |
|------|---------|
| 401 | `"Identifiants invalides."` (géré par Spring Security AuthenticationManager) |
| 400 | `"La requête contient des champs invalides."` |

---

### 3.2 Users — `/api/users/**`

#### GET /api/users/me
- **Description :** Retourne le profil de l'utilisateur authentifié.
- **Auth :** Bearer token
- **Rôles :** Tout utilisateur authentifié (ADMIN, PROF, STUDENT)
- **Response 200 :**
```json
{
  "id":        1,
  "fullName":  "Yassine Benali",
  "email":     "yassine@smartstudy.ma",
  "role":      "STUDENT",
  "plan":      "FREE",
  "createdAt": "2025-05-31T10:00:00"
}
```
- **Erreurs :**

| Code | Message |
|------|---------|
| 401 | `"Authentification requise. Veuillez vous connecter."` |

---

#### PUT /api/users/me
- **Description :** Met à jour le profil (nom et/ou mot de passe). Tous les champs sont optionnels.
- **Auth :** Bearer token
- **Rôles :** Tout utilisateur authentifié
- **Request body :**
```json
{
  "fullName":        "Yassine Benali (modifié)",  // optionnel, 2–100 car.
  "currentPassword": "Azerty1234!",              // requis si newPassword fourni
  "newPassword":     "NouveauPass2025!"          // optionnel, 8–100 car.
}
```
- **Response 200 :** `UserProfileResponse` (même structure que GET /me)
- **Erreurs :**

| Code | Message |
|------|---------|
| 400 | `"Le mot de passe actuel est incorrect."` |
| 401 | `"Authentification requise."` |

---

#### GET /api/users
- **Description :** Liste tous les comptes utilisateurs (triés par date de création décroissante).
- **Auth :** Bearer token
- **Rôles :** ADMIN uniquement
- **Response 200 :** `List<UserProfileResponse>`
- **Erreurs :**

| Code | Message |
|------|---------|
| 401 | `"Authentification requise."` |
| 403 | `"Accès refusé. Vous n'avez pas les droits nécessaires."` |

---

#### DELETE /api/users/{id}
- **Description :** Supprime définitivement un compte utilisateur.
- **Auth :** Bearer token
- **Rôles :** ADMIN uniquement
- **Path param :** `id` — Long, ID de l'utilisateur
- **Response 204 :** corps vide
- **Erreurs :**

| Code | Message |
|------|---------|
| 403 | `"Accès refusé."` |
| 404 | `"Utilisateur introuvable."` |

---

### 3.3 Sessions — `/api/sessions/**`

#### POST /api/sessions/create
- **Description :** Crée une nouvelle session de cours avec un code d'accès à 6 caractères généré aléatoirement.
- **Auth :** Bearer token
- **Rôles :** PROF uniquement
- **Request body :**
```json
{
  "title": "Cours d'algorithmique — S3"   // string, 3–255 car., obligatoire
}
```
- **Response 201 :**
```json
{
  "id":           1,
  "title":        "Cours d'algorithmique — S3",
  "joinCode":     "ABC123",
  "status":       "OPEN",
  "profName":     "Prof. Amina Kettani",
  "studentCount": 0,
  "createdAt":    "2025-05-31T10:00:00"
}
```
- **Erreurs :**

| Code | Message |
|------|---------|
| 403 | `"Accès refusé."` (rôle STUDENT ou ADMIN) |
| 400 | `"La requête contient des champs invalides."` |

---

#### GET /api/sessions/my
- **Description :** Retourne toutes les sessions créées par le professeur authentifié.
- **Auth :** Bearer token
- **Rôles :** PROF uniquement
- **Response 200 :** `List<SessionResponse>`

---

#### POST /api/sessions/join/{code}
- **Description :** Permet à un étudiant de rejoindre une session via son code d'accès à 6 caractères.
- **Auth :** Bearer token
- **Rôles :** STUDENT uniquement
- **Path param :** `code` — String, le `joinCode` de la session
- **Response 200 :** `SessionResponse` de la session rejointe
- **Erreurs :**

| Code | Message |
|------|---------|
| 403 | `"Accès refusé."` (rôle PROF) |
| 404 | `"Session introuvable pour le code fourni."` |
| 400 | `"La session est fermée."` |

---

#### GET /api/sessions/{id}
- **Description :** Retourne les détails d'une session par son ID.
- **Auth :** Bearer token
- **Rôles :** Tout utilisateur authentifié
- **Path param :** `id` — Long
- **Response 200 :** `SessionResponse`
- **Erreurs :**

| Code | Message |
|------|---------|
| 404 | `"Session introuvable."` |

---

#### PUT /api/sessions/{id}/close
- **Description :** Ferme une session (statut OPEN → CLOSED). Seul le professeur propriétaire peut fermer sa session.
- **Auth :** Bearer token
- **Rôles :** Propriétaire de la session (PROF)
- **Path param :** `id` — Long
- **Response 200 :** `SessionResponse` avec `status: "CLOSED"`
- **Erreurs :**

| Code | Message |
|------|---------|
| 403 | `"Accès refusé."` (pas le propriétaire) |
| 404 | `"Session introuvable."` |
| 400 | `"La session est déjà fermée."` |

---

### 3.4 Code Execution — `/api/code/**`

#### POST /api/code/execute
- **Description :** Exécute du code source dans un conteneur Docker isolé et retourne la sortie.
- **Auth :** Bearer token
- **Rôles :** STUDENT, PROF
- **Langages supportés :** `python`, `python3`, `py`, `javascript`, `js`, `typescript`, `ts`, `java`, `cpp`, `c++`, `php`
- **Request body :**
```json
{
  "code":     "print('Bonjour, SmartStudy!')",
  "language": "python",
  "stdin":    ""   // optionnel — entrée standard transmise au programme
}
```
- **Response 200 (succès) :**
```json
{
  "success":         true,
  "output":          "Bonjour, SmartStudy!\n",
  "error":           null,
  "executionTimeMs": 342,
  "status":          "SUCCESS",
  "language":        "python",
  "exitCode":        0
}
```
- **Response 200 (erreur d'exécution) :**
```json
{
  "success":         false,
  "output":          null,
  "error":           "NameError: name 'x' is not defined",
  "executionTimeMs": 150,
  "status":          "ERROR",
  "language":        "python",
  "exitCode":        1
}
```
- **Response 200 (timeout) :**
```json
{
  "success":  false,
  "error":    "L'exécution a dépassé la limite de 10 secondes.",
  "status":   "TIMEOUT",
  "exitCode": -1
}
```
- **Erreurs :**

| Code | Message |
|------|---------|
| 401 | `"Authentification requise."` |
| 403 | `"Accès refusé."` (rôle ADMIN) |
| 400 | `"Le code ne peut pas être vide."` |

> **Note :** Les erreurs d'exécution (syntaxe, runtime, timeout) sont retournées avec **HTTP 200** — le champ `success: false` indique l'échec au niveau applicatif.

---

#### GET /api/code/history
- **Description :** Retourne l'historique des exécutions de code de l'utilisateur authentifié, du plus récent au plus ancien.
- **Auth :** Bearer token
- **Rôles :** STUDENT, PROF
- **Response 200 :**
```json
[
  {
    "id":              42,
    "language":        "python",
    "code":            "print('Bonjour')  [200 premiers caractères]",
    "stdout":          "Bonjour\n",
    "stderr":          null,
    "exitCode":        0,
    "executionTimeMs": 342,
    "createdAt":       "2025-05-31T10:05:00"
  }
]
```

---

### 3.5 PDF — `/api/pdf/**`

#### POST /api/pdf/summarize
- **Description :** Reçoit un fichier PDF, extrait le texte, génère un résumé via l'API Grok, et persiste le résultat.
- **Auth :** Bearer token
- **Rôles :** Tout utilisateur authentifié
- **Content-Type :** `multipart/form-data`
- **Form field :** `file` — fichier PDF (max 50 Mo configuré dans `application.properties`)
- **Response 200 :**
```json
{
  "summary":   "Ce document traite de... [résumé généré par Grok]",
  "fileName":  "cours_algo_s3.pdf",
  "pageCount": 12
}
```
- **Erreurs :**

| Code | Message |
|------|---------|
| 400 | `"Le fichier n'est pas un PDF valide."` |
| 500 | `"Erreur lors de la communication avec l'API Grok."` |

---

#### GET /api/pdf/history
- **Description :** Retourne l'historique des résumés PDF de l'utilisateur, du plus récent au plus ancien. Le texte original extrait n'est pas inclus (volume).
- **Auth :** Bearer token
- **Rôles :** Tout utilisateur authentifié
- **Response 200 :**
```json
[
  {
    "id":        5,
    "fileName":  "cours_algo_s3.pdf",
    "summary":   "Ce document traite de...",
    "createdAt": "2025-05-31T11:00:00"
  }
]
```

---

### 3.6 Admin — `/api/admin/**`

#### GET /api/admin/stats
- **Description :** Retourne les statistiques globales de la plateforme (4 compteurs).
- **Auth :** Bearer token
- **Rôles :** ADMIN uniquement
- **Response 200 :**
```json
{
  "totalUsers":       42,
  "totalSessions":    18,
  "totalExecutions":  307,
  "totalPdfSummaries": 95
}
```
- **Erreurs :**

| Code | Message |
|------|---------|
| 403 | `"Accès refusé."` |

---

### 3.7 AI Analysis — `/api/ai/**`

#### GET /api/ai/analyze/{executionId}
- **Description :** Récupère un résultat d'exécution de code et demande à Grok une analyse pédagogique en français de l'erreur.
- **Auth :** Bearer token
- **Rôles :** Tout utilisateur authentifié
- **Path param :** `executionId` — Long, ID dans l'historique d'exécution
- **Response 200 :**
```json
{
  "executionId": 42,
  "language":    "python",
  "code":        "print(x)",
  "error":       "NameError: name 'x' is not defined",
  "analysis":    "Cette erreur signifie que la variable 'x' est utilisée sans avoir été définie au préalable..."
}
```
- **Erreurs :**

| Code | Message |
|------|---------|
| 404 | `"La ressource 'Résultat d'exécution' avec id = '42' est introuvable."` |
| 401 | `"Authentification requise."` |

---

## 4. Règles de sécurité par rôle

| Endpoint | ADMIN | PROF | STUDENT |
|----------|-------|------|---------|
| `POST /api/auth/**` | ✅ | ✅ | ✅ |
| `GET /api/users/me` | ✅ | ✅ | ✅ |
| `PUT /api/users/me` | ✅ | ✅ | ✅ |
| `GET /api/users` | ✅ | ❌ | ❌ |
| `DELETE /api/users/{id}` | ✅ | ❌ | ❌ |
| `POST /api/sessions/create` | ❌ | ✅ | ❌ |
| `GET /api/sessions/my` | ❌ | ✅ | ❌ |
| `POST /api/sessions/join/{code}` | ❌ | ❌ | ✅ |
| `GET /api/sessions/{id}` | ✅ | ✅ | ✅ |
| `PUT /api/sessions/{id}/close` | ✅ | ✅ (propriétaire) | ❌ |
| `POST /api/code/execute` | ❌ | ✅ | ✅ |
| `GET /api/code/history` | ❌ | ✅ | ✅ |
| `POST /api/pdf/summarize` | ✅ | ✅ | ✅ |
| `GET /api/pdf/history` | ✅ | ✅ | ✅ |
| `GET /api/admin/stats` | ✅ | ❌ | ❌ |
| `GET /api/ai/analyze/{id}` | ✅ | ✅ | ✅ |

**Format des rôles Spring Security :** `ROLE_ADMIN`, `ROLE_PROF`, `ROLE_STUDENT`  
(le préfixe `ROLE_` est géré par Spring; dans les DTOs et la DB le préfixe est absent)

---

## 5. Flux d'exécution de code Docker sandbox

```
POST /api/code/execute
        │
        ▼
CodeExecutionController.execute()
  │  (récupère l'email depuis SecurityContextHolder)
  ▼
CodeExecutionServiceImpl.execute()
  │  1. Résolution de l'utilisateur en DB (pour persistance)
  │  2. Appel dockerSandboxService.execute(language, code, stdin, timeout)
  │
  ▼
DockerSandboxService.execute()
  │
  ├─ 1. Résolution du langage → LanguageConfig (image Docker + nom de fichier)
  │       Langages : python:3.12-alpine, node:20-alpine, openjdk:21-slim,
  │                  gcc:13, php:8.3-alpine, smartstudy-ts:latest (image custom)
  │
  ├─ 2. createContainer() — contraintes de sécurité :
  │       • --network none          (aucun accès réseau)
  │       • --memory 128m           (limite mémoire configurable)
  │       • --memory-swap 128m      (swap désactivé)
  │       • --cpus 0.5              (quota CPU)
  │       • --pids-limit 64         (protection fork bomb)
  │       • --security-opt no-new-privileges
  │
  ├─ 3. copyToSandbox() — injection du code via archive TAR
  │       Le fichier est écrit dans /sandbox/<nom_fichier>
  │       stdin optionnel → /sandbox/stdin.txt
  │
  ├─ 4. startContainerCmd()
  │
  ├─ 5. waitForContainer(timeout=10s)
  │       Si timeout → killContainer(SIGKILL) → retourne TIMEOUT
  │
  ├─ 6. getExitCode() via inspectContainerCmd()
  │
  ├─ 7. collectLogs() — stdout + stderr séparés via Docker log API
  │
  └─ 8. removeContainer(force=true) — nettoyage systématique
          (dans le bloc finally — même en cas d'exception)
        │
        ▼
  CodeResponse {success, output, error, status, language, exitCode, executionTimeMs}
        │
        ▼
CodeExecutionServiceImpl.persistExecutionResult()
  — sauvegarde en DB (ExecutionResult) pour l'historique
  — les erreurs de persistance sont journalisées mais NE font PAS échouer la réponse
```

**Commandes d'exécution par langage :**

| Langage | Commande |
|---------|----------|
| python | `python3 /sandbox/solution.py [< /sandbox/stdin.txt]` |
| javascript | `node /sandbox/solution.js [< /sandbox/stdin.txt]` |
| typescript | `ts-node --skip-project /sandbox/solution.ts [< /sandbox/stdin.txt]` |
| java | `javac /sandbox/Nom.java && java -Xmx96m -cp /sandbox Nom [< ...]` |
| cpp | `g++ -O2 -std=c++17 -o /sandbox/solution /sandbox/solution.cpp && /sandbox/solution` |
| php | `php /sandbox/solution.php [< /sandbox/stdin.txt]` |

**Warm-up au démarrage :** `@PostConstruct` télécharge en arrière-plan les images Docker de base et construit l'image TypeScript si absente — l'application démarre sans attendre.

---

## 6. Problèmes identifiés lors de l'audit

### 6.1 Bugs / anomalies

| # | Fichier | Problème | Sévérité |
|---|---------|----------|----------|
| 1 | `CodeExecutionController.java` | Classe `@Configuration` (`DockerConfig`) imbriquée dans un `@RestController`. Fonctionne mais viole le principe de séparation des responsabilités. Le bean `DockerClient` devrait être dans une classe `@Configuration` dédiée. | Moyen |
| 2 | `exception/RessourceNotFoundException.java` | Doublon de `ResourceNotFoundException` avec un nom mal orthographié ("Ressource" au lieu de "Resource"). Les deux sont dans le `GlobalExceptionHandler` via `ApiException`. Risque de confusion dans les services. | Faible |
| 3 | `exception/UnauthrizedException.java` | Nom de classe mal orthographié ("Unauthrized" au lieu de "Unauthorized"). | Faible |
| 4 | `Service/IAuthServicelmpl.java` | Nom d'interface incorrect : `IAuthServicelmpl` (le "l" minuscule devrait être "I" : `IAuthServiceImpl`). Le nom suggère une implémentation, pas une interface. | Faible |
| 5 | `CodeExecutionController` | N'injecte pas `@AuthenticationPrincipal` — l'email de l'utilisateur est récupéré via `SecurityContextHolder` dans le service. Fonctionne mais rend le test unitaire du service plus difficile. | Faible |
| 6 | `AiAnalysisResponse.java` | Le commentaire indique "réponse DeepSeek" mais le service utilisé est `IGrokAiService` (Grok). Reste de code d'une migration DeepSeek → Grok non nettoyée. | Cosmétique |
| 7 | `Service/Impl/PythonExecutionStrategy.java`, `JavaScriptExecutionStrategy.java`, `javaExecutionStrategy.java` | Anciennes stratégies d'exécution directe (sans Docker) marquées `@Deprecated` mais toujours présentes dans le codebase. Elles peuvent être supprimées sans impact. | Faible |

### 6.2 Endpoints de la spec qui diffèrent de l'implémentation réelle

| Spec (tâche demandée) | Endpoint réel | Note |
|-----------------------|---------------|------|
| `POST /api/sessions` | `POST /api/sessions/create` | Le chemin de création est `/create` |
| `GET /api/sessions` | `GET /api/sessions/my` | Retourne seulement les sessions du prof connecté |
| `POST /api/sessions/join` (body) | `POST /api/sessions/join/{code}` (path variable) | Le code est dans l'URL, pas dans le body |

### 6.3 Fonctionnalités manquantes / non implémentées

- Pas de **refresh token** — le JWT expire après 24h et l'utilisateur doit se reconnecter.
- Pas d'**endpoint `/api/prof/**`** malgré la règle de sécurité déclarée dans `SecurityConfig`.
- Pas de **pagination** sur `GET /api/users` — retourne tous les utilisateurs en une seule réponse.
- Pas de **validation de propriété** sur `GET /api/sessions/{id}` — tout utilisateur authentifié peut voir n'importe quelle session.
- La **fermeture de session** (`PUT /api/sessions/{id}/close`) est déclarée `authenticated()` dans `SecurityConfig` mais le service devrait vérifier que l'appelant est bien le propriétaire (à confirmer dans `SessionServiceImpl`).
