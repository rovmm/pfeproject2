# SmartStudy — Guide de test Postman (pas à pas)

> Prérequis : serveur Spring Boot démarré sur `http://localhost:8080`, base MySQL disponible, Docker Engine actif.

---

## Configuration initiale

1. Importez `SmartStudy.postman_collection.json` dans Postman (**Import → Upload Files**)
2. Importez `SmartStudy.postman_environment.json` dans Postman (**Environments → Import**)
3. Sélectionnez l'environnement **SmartStudy — Local** dans le sélecteur en haut à droite
4. Vérifiez que `base_url` est bien `http://localhost:8080`

---

## Étape 1 — Inscription d'un PROF

**Dossier :** Auth → **Register (PROF)**

**Request body :**
```json
{
  "fullName": "Prof. Amina Kettani",
  "email":    "amina.kettani@smartstudy.ma",
  "password": "ProfPass2025!",
  "role":     "PROF"
}
```

**Envoyer** → attendu : `201 Created`

**Résultat attendu :**
```json
{
  "token":    "eyJhbGciOiJIUzI1NiJ9...",
  "id":       1,
  "fullName": "Prof. Amina Kettani",
  "email":    "amina.kettani@smartstudy.ma",
  "role":     "PROF",
  "plan":     "FREE"
}
```

Le script de test sauvegarde automatiquement `{{token}}` et `{{userId}}` dans les variables de collection.

**Vérification :**
- Status = 201 ✅
- `role` = `"PROF"` ✅
- `token` non vide ✅

> **Notez le token du PROF** — vous en aurez besoin à l'étape 3. Renommez-le `PROF_TOKEN` dans une variable manuelle ou copiez-le temporairement.

---

## Étape 2 — Inscription d'un STUDENT

**Dossier :** Auth → **Register**

**Request body :**
```json
{
  "fullName": "Yassine Benali",
  "email":    "yassine.benali@smartstudy.ma",
  "password": "Azerty1234!",
  "role":     "STUDENT"
}
```

**Envoyer** → attendu : `201 Created`

**Vérification :**
- Status = 201 ✅
- `role` = `"STUDENT"` ✅
- `{{token}}` est maintenant le token du STUDENT (les variables sont mises à jour)

> **Notez le token du STUDENT** — vous l'utiliserez aux étapes 4, 5 et 6.

---

## Étape 3 — Le PROF crée une session

**Action préalable :** Remettez le token du PROF dans la variable `{{token}}`  
(soit en appelant à nouveau **Login** avec les credentials du PROF, soit manuellement dans l'onglet Variables)

**Dossier :** Sessions → **POST /api/sessions/create (PROF)**

**Request body :**
```json
{
  "title": "Cours d'algorithmique — Prof. Amina Kettani"
}
```

**Envoyer** → attendu : `201 Created`

**Résultat attendu :**
```json
{
  "id":           1,
  "title":        "Cours d'algorithmique — Prof. Amina Kettani",
  "joinCode":     "XK7P2Q",
  "status":       "OPEN",
  "profName":     "Prof. Amina Kettani",
  "studentCount": 0,
  "createdAt":    "2025-05-31T10:00:00"
}
```

Le script sauvegarde `{{sessionId}}` et `{{sessionCode}}` automatiquement.

**Vérification :**
- Status = 201 ✅
- `joinCode` a 6 caractères ✅
- `status` = `"OPEN"` ✅
- `{{sessionId}}` et `{{sessionCode}}` renseignés dans les variables ✅

---

## Étape 4 — Le STUDENT rejoint la session

**Action préalable :** Remettez le token du STUDENT dans `{{token}}`  
(appel Login avec `yassine.benali@smartstudy.ma` / `Azerty1234!` ou manuellement)

**Dossier :** Sessions → **POST /api/sessions/join/{code} (STUDENT)**

L'URL utilise automatiquement `{{sessionCode}}` — vérifiez que la variable est bien renseignée.

**Envoyer** → attendu : `200 OK`

**Résultat attendu :**
```json
{
  "id":           1,
  "title":        "Cours d'algorithmique — Prof. Amina Kettani",
  "joinCode":     "XK7P2Q",
  "status":       "OPEN",
  "profName":     "Prof. Amina Kettani",
  "studentCount": 1,
  "createdAt":    "2025-05-31T10:00:00"
}
```

**Vérification :**
- Status = 200 ✅
- `studentCount` = 1 ✅ (le STUDENT a bien rejoint)
- `status` = `"OPEN"` ✅

---

## Étape 5 — Le STUDENT exécute du code Python

Le token du STUDENT doit être dans `{{token}}`.

**Dossier :** Code Execution → **POST /api/code/execute**

**Request body :**
```json
{
  "language": "python",
  "code":     "name = input()\nprint(f'Bonjour, {name}! Bienvenue sur SmartStudy.')",
  "stdin":    "Yassine"
}
```

**Envoyer** → attendu : `200 OK`

**Résultat attendu :**
```json
{
  "success":         true,
  "output":          "Bonjour, Yassine! Bienvenue sur SmartStudy.\n",
  "error":           null,
  "executionTimeMs": 350,
  "status":          "SUCCESS",
  "language":        "python",
  "exitCode":        0
}
```

**Vérification :**
- Status HTTP = 200 ✅
- `success` = `true` ✅
- `output` contient `"Bonjour, Yassine!"` ✅
- `status` = `"SUCCESS"` ✅
- `exitCode` = `0` ✅

> **Si Docker n'est pas disponible :** vous obtiendrez `status: "ERROR"` avec un message d'erreur interne. Vérifiez que le daemon Docker est lancé (`systemctl start docker` ou `sudo service docker start`).

---

## Étape 6 — Le STUDENT soumet un PDF pour résumé

Le token du STUDENT doit être dans `{{token}}`.

**Dossier :** PDF → **POST /api/pdf/summarize**

1. Dans l'onglet **Body**, sélectionnez **form-data**
2. Champ `file` → type **File** → sélectionnez un fichier PDF (cours, article, etc.)

**Envoyer** → attendu : `200 OK`

**Résultat attendu :**
```json
{
  "summary":   "Ce document présente les concepts fondamentaux de l'algorithmique...",
  "fileName":  "cours_algo.pdf",
  "pageCount": 8
}
```

**Vérification :**
- Status = 200 ✅
- `summary` non vide ✅ (le résumé Grok est présent)
- `fileName` correspond au fichier soumis ✅

> **Si la clé Grok est absente (`GROK_API_KEY` non défini) :** vous obtiendrez une erreur 500. Définissez la variable d'environnement avant de lancer l'application.

**Vérifier l'historique :**

Dossier PDF → **GET /api/pdf/history** → attendu : liste contenant le résumé généré à l'instant.

---

## Étape 7 — L'ADMIN consulte les statistiques

**Action préalable :** Obtenez un token ADMIN (compte créé directement en base de données — l'inscription ADMIN est bloquée via l'API).

Exemple de création directe (MySQL) :
```sql
INSERT INTO users (full_name, email, password, role, plan, created_at, updated_at)
VALUES (
  'Admin SmartStudy',
  'admin@smartstudy.ma',
  '$2a$10$...',   -- hash BCrypt de votre mot de passe (généré via https://bcrypt-generator.com/)
  'ADMIN',
  'FREE',
  NOW(),
  NOW()
);
```

Puis connectez-vous : Auth → **Login** avec les credentials admin.

Le script sauvegarde `{{token}}` avec le token ADMIN.

**Dossier :** Admin → **GET /api/admin/stats**

**Envoyer** → attendu : `200 OK`

**Résultat attendu :**
```json
{
  "totalUsers":        3,
  "totalSessions":     1,
  "totalExecutions":   1,
  "totalPdfSummaries": 1
}
```

**Vérification :**
- Status = 200 ✅
- `totalUsers` ≥ 3 (admin + prof + student) ✅
- `totalSessions` ≥ 1 ✅
- `totalExecutions` ≥ 1 ✅
- `totalPdfSummaries` ≥ 1 ✅

---

## Étape Bonus — Analyse IA d'une exécution avec erreur

1. Exécutez du code Python avec une erreur intentionnelle :

**POST /api/code/execute**
```json
{
  "language": "python",
  "code":     "print(variable_inexistante)",
  "stdin":    ""
}
```

2. Récupérez l'`id` de l'exécution depuis `GET /api/code/history` — la variable `{{executionId}}` est renseignée automatiquement.

3. **GET /api/ai/analyze/{{executionId}}**

**Résultat attendu :**
```json
{
  "executionId": 2,
  "language":    "python",
  "code":        "print(variable_inexistante)",
  "error":       "NameError: name 'variable_inexistante' is not defined",
  "analysis":    "Cette erreur Python de type NameError signifie que vous tentez d'utiliser une variable qui n'a pas encore été définie..."
}
```

---

## Récapitulatif des tokens par étape

| Étape | Token utilisé | Action |
|-------|--------------|--------|
| 1 | — | Register PROF → token PROF sauvegardé |
| 2 | — | Register STUDENT → token STUDENT sauvegardé |
| 3 | PROF token | Créer session → sessionId + sessionCode sauvegardés |
| 4 | STUDENT token | Rejoindre session |
| 5 | STUDENT token | Exécuter code Python |
| 6 | STUDENT token | Soumettre PDF |
| 7 | ADMIN token | Consulter stats |

---

## Erreurs fréquentes

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| `401 Authentification requise` | Token absent ou expiré | Relancez Login, copiez le nouveau token |
| `403 Accès refusé` | Mauvais rôle pour l'endpoint | Vérifiez que vous utilisez le bon compte (PROF/STUDENT/ADMIN) |
| `Docker connection refused` | Daemon Docker non démarré | `sudo systemctl start docker` |
| `500 Erreur Grok` | `GROK_API_KEY` absent | Définissez la variable d'environnement et redémarrez l'app |
| `400 Email déjà utilisé` | Compte déjà créé | Utilisez Login au lieu de Register |
| Session `404` au join | `sessionCode` mal copié | Vérifiez `{{sessionCode}}` dans les variables d'environnement |
