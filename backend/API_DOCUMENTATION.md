# Documentation des API - Quiz Platform Backend

## Table des matières
1. [Authentification](#authentification)
2. [Exécution de Code](#exécution-de-code)
3. [Intelligence Artificielle](#intelligence-artificielle)
4. [PDF](#pdf)
5. [Sessions](#sessions)
6. [Historique d'exécution](#historique-dexécution)

---

## Authentification
**Base URL:** `/api/auth`  
**CORS:** `http://localhost:4200`

### 1. Connexion (Login)
**POST** `/api/auth/login`

#### Request Body - `LoginRequest`
```json
{
  "email": "string",     // Requis, format email, max 100 caractères
  "password": "string"   // Requis, min 6 caractères, max 100 caractères
}
```

#### Response - `JwtResponse` (200 OK)
```json
{
  "token": "string",     // JWT token
  "id": "long",         // ID utilisateur
  "fullName": "string",  // Nom complet
  "email": "string",     // Email
  "role": "string",      // ADMIN, PROF, ou STUDENT
  "plan": "string"       // Plan de l'utilisateur
}
```

---

### 2. Inscription (Register)
**POST** `/api/auth/register`

#### Request Body - `RegisterRequest`
```json
{
  "fullName": "string",   // Requis, max 100 caractères
  "email": "string",      // Requis, format email, max 100 caractères
  "password": "string",   // Requis, min 8 caractères, max 100 caractères
  "role": "enum"          // Requis, valeurs: ADMIN, PROF, STUDENT
}
```

#### Response - `UserResponse` (200 OK)
```json
{
  "id": "long",           // ID utilisateur
  "fullName": "string",   // Nom complet
  "email": "string",      // Email
  "role": "string",       // ADMIN, PROF, ou STUDENT
  "plan": "string"        // Plan de l'utilisateur
}
```

---

## Exécution de Code
**Base URL:** `/api/code`

### 3. Exécuter du code
**POST** `/api/code/execute`

#### Request Body - `CodeRequest`
```json
{
  "code": "string",      // Requis, le code à exécuter
  "language": "string",  // Requis, langage (java, python, javascript)
  "stdin": "string"      // Optionnel, entrée standard pour le programme
}
```

#### Response - `CodeResponse` (200 OK)
```json
{
  "success": "boolean",        // true si exécution réussie
  "output": "string",         // Sortie standard (si succès)
  "error": "string",          // Message d'erreur (si échec)
  "executionTimeMs": "long",  // Temps d'exécution en ms
  "status": "string",         // SUCCESS, ERROR, TIMEOUT, UNSUPPORTED
  "language": "string",       // Langage utilisé
  "exitCode": "int"          // Code de sortie (0=succès, -1=erreur)
}
```

#### Statuts possibles:
- **SUCCESS**: Exécution réussie (exitCode: 0)
- **ERROR**: Erreur d'exécution (exitCode: -1)
- **TIMEOUT**: Délai d'attente dépassé (exitCode: -1)
- **UNSUPPORTED**: Langage non supporté (exitCode: -1)

---

## Historique d'exécution

### 4. Obtenir l'historique d'exécution
**GET** `/api/code/history`  
**Authentification:** Requise (JWT)

#### Response - `List<ExecutionResult>` (200 OK)
```json
[
  {
    "id": "long",                   // ID de l'exécution
    "language": "string",           // Langage utilisé
    "code": "string",               // Code exécuté
    "output": "string",             // Sortie standard
    "error": "string",              // Erreur (si applicable)
    "executionTimeMs": "long",      // Temps d'exécution en ms
    "status": "enum",               // SUCCESS, ERROR, TIMEOUT
    "createdAt": "datetime",        // Date de création
    "user": {                       // Utilisateur ayant exécuté le code
      "id": "long",
      "fullName": "string",
      "email": "string",
      "role": "enum"
    }
  }
]
```

---

## Intelligence Artificielle
**Base URL:** `/api/ai`  
**CORS:** `http://localhost:4200`

### 5. Analyser une exécution avec l'IA
**GET** `/api/ai/analyze/{executionId}`  
**Authentification:** Requise (JWT)

#### Path Parameter
- `executionId` (Long): ID de l'exécution à analyser

#### Response - `AiAnalysisResponse` (200 OK)
```json
{
  "executionId": "long",    // ID de l'exécution
  "language": "string",     // Langage utilisé
  "code": "string",         // Code analysé
  "error": "string",        // Erreur rencontrée
  "analysis": "string"      // Analyse de l'IA (DeepSeek) en français
}
```

---

## PDF
**Base URL:** `/api/pdf`  
**CORS:** `http://localhost:4200`

### 6. Résumer un PDF avec l'IA
**POST** `/api/pdf/summarize`  
**Content-Type:** `multipart/form-data`  
**Authentification:** Requise (JWT)

#### Request Parameters
- `file` (MultipartFile): Fichier PDF à résumer

#### Response - `SummaryResponse` (200 OK)
```json
{
  "summary": "string",      // Résumé généré par l'IA en français
  "fileName": "string",     // Nom du fichier original
  "pageCount": "int"        // Nombre de pages du PDF
}
```

---

## Sessions
**Base URL:** `/api/sessions`  
**CORS:** `http://localhost:4200`  
**Authentification:** Requise (JWT)

### 7. Créer une session (PROF uniquement)
**POST** `/api/sessions/create`

#### Request Body - `CreateSessionRequest`
```json
{
  "title": "string"   // Requis, min 3 caractères, max 255 caractères
}
```

#### Response - `SessionResponse` (201 Created)
```json
{
  "id": "long",            // ID de la session
  "title": "string",       // Titre de la session
  "joinCode": "string",    // Code de rejoindre (pour les étudiants)
  "status": "enum",        // OPEN ou CLOSED
  "profName": "string",    // Nom du professeur
  "studentCount": "int",   // Nombre d'étudiants inscrits
  "createdAt": "datetime"  // Date de création
}
```

---

### 8. Obtenir mes sessions (PROF uniquement)
**GET** `/api/sessions/my`

#### Response - `List<SessionResponse>` (200 OK)
```json
[
  {
    "id": "long",
    "title": "string",
    "joinCode": "string",
    "status": "enum",       // OPEN ou CLOSED
    "profName": "string",
    "studentCount": "int",
    "createdAt": "datetime"
  }
]
```

---

### 9. Rejoindre une session (STUDENT uniquement)
**POST** `/api/sessions/join/{code}`

#### Path Parameter
- `code` (String): Code de la session à rejoindre

#### Response - `SessionResponse` (200 OK)
```json
{
  "id": "long",
  "title": "string",
  "joinCode": "string",
  "status": "enum",
  "profName": "string",
  "studentCount": "int",
  "createdAt": "datetime"
}
```

---

### 10. Obtenir une session par ID
**GET** `/api/sessions/{id}`  
**Accès:** Tout utilisateur authentifié

#### Path Parameter
- `id` (Long): ID de la session

#### Response - `SessionResponse` (200 OK)
```json
{
  "id": "long",
  "title": "string",
  "joinCode": "string",
  "status": "enum",
  "profName": "string",
  "studentCount": "int",
  "createdAt": "datetime"
}
```

---

### 11. Fermer une session (PROF uniquement)
**PUT** `/api/sessions/{id}/close`

#### Path Parameter
- `id` (Long): ID de la session à fermer

#### Response - `SessionResponse` (200 OK)
```json
{
  "id": "long",
  "title": "string",
  "joinCode": "string",
  "status": "CLOSED",
  "profName": "string",
  "studentCount": "int",
  "createdAt": "datetime"
}
```

---

## Enums

### RoleEnum
- `ADMIN` - Administrateur
- `PROF` - Professeur
- `STUDENT` - Étudiant

### SessionStatus
- `OPEN` - Session ouverte
- `CLOSED` - Session fermée

### ExecutionStatus
- `SUCCESS` - Exécution réussie
- `ERROR` - Erreur d'exécution
- `TIMEOUT` - Délai d'attente dépassé

---

## Notes importantes

1. **Authentification JWT**: La plupart des endpoints nécessitent un token JWT dans le header:
   ```
   Authorization: Bearer <token>
   ```

2. **CORS**: Les endpoints Auth, AI, PDF et Sessions autorisent les requêtes depuis `http://localhost:4200`

3. **Validation**: Tous les champs marqués comme requis sont validés côté serveur

4. **UserController**: Aucun endpoint défini actuellement (classe vide)

5. **Langages supportés pour l'exécution de code**: java, python, javascript

6. **Services d'IA disponibles**:
   - DeepSeek (utilisé pour l'analyse d'erreurs et résumé PDF)
   - Grok (implémenté mais non utilisé dans les endpoints actuels)
