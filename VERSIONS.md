# Versions des technologies — SmartStudy

## Backend (Java / Spring) — `backend/pom.xml`
| Techno | Version |
|---|---|
| Java | 17 (target compilation) |
| Spring Boot (parent) | 3.5.6 |
| Spring AI | 1.0.3 |
| Spring AI Tika Document Reader | 1.0.3 |
| spring-dotenv | 4.0.0 |
| spring-boot-starter-validation | 3.5.6 |
| Flyway (core + mysql) | hérité du parent Spring Boot 3.5.6 |
| MySQL Connector/J | hérité du parent Spring Boot 3.5.6 |
| Lombok | hérité du parent Spring Boot 3.5.6 |
| JJWT (api / impl / jackson) | 0.11.5 |
| Apache PDFBox | 2.0.29 |
| Docker Java Client (core + transport-okhttp) | 3.3.4 |

Environnement local détecté : OpenJDK **21.0.11** (runtime machine, différent du `java.version=17` du pom).

---

## Frontend principal — `frontend/package.json`
| Techno | Version |
|---|---|
| React | 19.2.7 |
| React DOM | 19.2.7 |
| React Router DOM | 7.18.1 |
| TypeScript | ~6.0.2 |
| Vite | ^8.1.1 |
| @vitejs/plugin-react | 6.0.3 |
| @monaco-editor/react | 4.7.0 |
| monaco-editor | 0.55.1 |
| axios | 1.6.0 |
| framer-motion | 12.42.2 |
| oxlint | 1.71.0 |
| @types/node | 24.13.2 |
| @types/react | 19.2.17 |
| @types/react-dom | 19.2.3 |

---

## Frontend `smartstudyapp (8)/package.json` (semble être un duplicata de `frontend/`, sans axios/framer-motion)
| Techno | Version |
|---|---|
| React | 19.2.7 |
| React DOM | 19.2.7 |
| React Router DOM | 7.18.1 |
| TypeScript | ~6.0.2 |
| Vite | ^8.1.1 |
| @vitejs/plugin-react | 6.0.3 |
| @monaco-editor/react | 4.7.0 |
| monaco-editor | 0.55.1 |
| oxlint | 1.71.0 |
| @types/node | 24.13.2 |
| @types/react | 19.2.17 |
| @types/react-dom | 19.2.3 |

---

## Frontend legacy — `frontend-legacy-tailwind/package.json` (stack plus ancienne, Tailwind + ESLint)
| Techno | Version |
|---|---|
| React | 18.2.0 |
| React DOM | 18.2.0 |
| React Router DOM | 6.15.0 |
| TypeScript | 5.0.2 |
| Vite | 4.4.5 |
| @vitejs/plugin-react | 4.0.3 |
| @monaco-editor/react | 4.6.0 |
| axios | 1.6.0 |
| lucide-react | 0.263.1 |
| Tailwind CSS | 3.3.3 |
| PostCSS | 8.4.28 |
| Autoprefixer | 10.4.15 |
| ESLint | 8.45.0 |
| @typescript-eslint/eslint-plugin | 6.0.0 |
| @typescript-eslint/parser | 6.0.0 |
| eslint-plugin-react-hooks | 4.6.0 |
| eslint-plugin-react-refresh | 0.4.3 |
| Playwright | 1.60.0 |
| @types/react | 18.2.15 |
| @types/react-dom | 18.2.7 |

---

## Environnement local
| Outil | Version |
|---|---|
| Node.js | v20.19.0 |
| npm | 10.8.2 |
| Java (runtime) | OpenJDK 21.0.11 |

---

**Remarque** : trois dossiers frontend coexistent dans le repo (`frontend/`, `smartstudyapp (8)/`, `frontend-legacy-tailwind/`). Les deux premiers sont quasi identiques (React 19 + Vite 8), le troisième est une stack legacy React 18 + Tailwind. À clarifier lequel est actif en production.
