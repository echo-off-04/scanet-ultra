# Manifeste de Migration: React/Vite/Supabase -> Next.js/PostgreSQL/Prisma

Ce document est un guide opératoire pour un autre agent chargé de reproduire la migration sur ce projet ou sur un projet similaire.

Objectif principal:

- Migrer l'application vers Next.js (App Router) sans casse fonctionnelle.
- Remplacer la dépendance backend Supabase par PostgreSQL + Prisma + API routes Next.
- Conserver la continuité produit pendant la transition.

---

## 1) Résultat atteint sur ce projet

Changements réalisés et validés:

- Runtime basculé vers Next.js 14 (`dev`, `build`, `start`).
- Bootstrap App Router en mode compatibilité SPA (route catch-all).
- Prisma ajouté et initialisé:
  - [prisma/schema.prisma](../prisma/schema.prisma)
  - [src/lib/prisma.ts](../src/lib/prisma.ts)
- Auth Supabase remplacée par des routes API Next:
  - `POST /api/auth/sign-in`
  - `POST /api/auth/sign-up`
  - `POST /api/auth/sign-out`
  - `GET /api/auth/session`
  - `PATCH /api/auth/update-password`
  - `POST /api/auth/reset-password-request`
  - `POST /api/auth/reset-password`
- Bridge de compatibilité frontend pour limiter les refactors immédiats:
  - [src/lib/supabase.ts](../src/lib/supabase.ts)
- Bridge CRUD générique côté API:
  - `GET/POST/PATCH/DELETE /api/db/[table]`
  - [src/app/api/db/[table]/route.ts](../src/app/api/db/%5Btable%5D/route.ts)
- Remplacement des fonctions annexes:
  - upload: `POST /api/storage/upload`
  - email: `POST /api/email/send`
  - OCR: `POST /api/ocr/scan-business-card`
  - jobs: `POST /api/jobs/process-scheduled-emails` (scaffold)
- Durcissement anti-500 sur la route DB générique.
- Alignement schéma `events` + migration SQL pour supprimer l'erreur 42703 sur `status`.

Validation obtenue:

- `npm run typecheck` OK
- `npm run test` OK
- `npm run build` OK

---

## 2) Procédure de migration recommandée (ordre strict)

### Phase A - Audit et cadrage

1. Cartographier les accès Supabase du frontend.
2. Lister les tables réellement utilisées par l'UI.
3. Identifier les routes métier critiques (auth, contacts, events, opportunités, emails).
4. Définir une stratégie de compatibilité temporaire (bridge), puis une stratégie de sortie (routes métier dédiées).

Checklist de sortie Phase A:

- Inventaire des `.from("table")` terminé.
- Liste des champs réellement attendus par chaque écran.
- Liste des flux critiques à tester en priorité.

### Phase B - Basculer l'exécution vers Next.js

1. Mettre à jour scripts npm vers `next dev/build/start`.
2. Ajouter structure App Router.
3. Mettre en place un shell de compatibilité pour éviter un refactor big-bang.
4. Remplacer les usages `import.meta.env`.

Checklist de sortie Phase B:

- L'application démarre sous Next sans erreur bloquante.
- Navigation existante fonctionnelle en mode compatibilité.

### Phase C - Installer le socle données Prisma/PostgreSQL

1. Créer le client Prisma partagé.
2. Définir le schéma initial dans [prisma/schema.prisma](../prisma/schema.prisma).
3. Générer client et appliquer migrations.

Commandes:

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:deploy
```

Checklist de sortie Phase C:

- Connexion DB opérationnelle.
- Prisma Client généré sans erreur.

### Phase D - Migrer l'authentification

1. Implémenter routes auth Next API.
2. Migrer hash mot de passe + sessions (cookies/JWT).
3. Adapter contexte auth frontend pour consommer les nouvelles routes.

Checklist de sortie Phase D:

- Sign-up/sign-in/sign-out OK.
- Session restore OK au refresh.
- Update/reset password OK.

### Phase E - Introduire un bridge de compatibilité frontend

1. Conserver l'API frontend Supabase-like via [src/lib/supabase.ts](../src/lib/supabase.ts).
2. Router les opérations vers `/api/db/[table]`.
3. Ne pas casser les signatures utilisées dans les composants existants.

Checklist de sortie Phase E:

- Les composants existants compilent sans refactor massif.
- Les requêtes de lecture/écriture passent par Next API.

### Phase F - Durcir la route DB générique avant généralisation

Points obligatoires dans [src/app/api/db/[table]/route.ts](../src/app/api/db/%5Btable%5D/route.ts):

- Whitelist stricte des tables (`ALLOWED_TABLES`).
- Vérification d'existence de table via `information_schema`.
- Vérification des colonnes autorisées pour `select`, `filters`, `orderBy`.
- Sanitization des colonnes d'`insert/update` (drop des colonnes inconnues).
- Cast SQL explicite pour types sensibles:
  - uuid
  - timestamp/date/time
- Normalisation UUID vide (`"" -> null`) pour éviter `22P02`.
- Mapping des erreurs Postgres vers statuts HTTP non-500 quand prévisible:
  - `42703` -> 400
  - `42P01` -> 404
  - `22P02`, `42804` -> 400
  - `23502` -> 400
  - `23503` -> 409
  - `23505` -> 409

Checklist de sortie Phase F:

- Requête invalide ne provoque plus de 500 générique.
- Erreurs de schéma/colonnes renvoyées en réponses explicites.

### Phase G - Aligner schéma DB avec les champs réellement utilisés

Procédure:

1. Prendre un flux cassé prioritaire.
2. Reproduire l'erreur.
3. Comparer payload frontend vs colonnes DB.
4. Corriger Prisma + migration SQL.
5. Rejouer le flux.

Exemple réel corrigé dans ce projet:

- Symptôme: `POST /api/db/events` -> erreur `42703` sur `status`.
- Cause: colonnes frontend absentes de `events`.
- Correctif:
  - Ajout des champs dans [prisma/schema.prisma](../prisma/schema.prisma)
  - Migration [prisma/migrations/20260406201000_events_profile_fields/migration.sql](../prisma/migrations/20260406201000_events_profile_fields/migration.sql)

---

## 3) Erreurs rencontrées et prévention

| Erreur rencontrée               | Cause racine                               | Correctif appliqué                    | Bonne pratique préventive                             |
| ------------------------------- | ------------------------------------------ | ------------------------------------- | ----------------------------------------------------- |
| 500 sur création d'event        | Champ `status` absent en DB                | Migration `events` + update Prisma    | Auditer les champs UI avant ouverture du flux         |
| 500 génériques sur SQL invalide | Pas de mapping d'erreurs DB                | Mapping PG code -> HTTP               | Ne jamais renvoyer 500 pour erreur prévisible         |
| Crash sur colonnes inconnues    | Payload frontend plus large que schéma     | Sanitization insert/update            | Filtrer systématiquement par colonnes existantes      |
| Erreurs de type UUID/date       | Placeholders SQL non castés                | Cast typés `::uuid`, `::timestamp`... | Appliquer un cast SQL piloté par `information_schema` |
| Erreurs table absente           | Frontend appelle table non migrée          | Retour 404 `Table not available`      | Vérifier la table avant d'exécuter la requête         |
| Bruit de diff Git               | Fichiers build versionnés accidentellement | Nettoyage et vigilance                | Ignorer `.next` et artefacts locaux                   |

---

## 4) Bonnes pratiques obligatoires pour un autre agent

1. Migrer en mode incrémental, jamais en big-bang.
2. Commencer par les flux critiques métiers avant les fonctionnalités secondaires.
3. Toujours coupler refactor code + migration DB + test de non-régression.
4. Introduire un bridge de compatibilité temporaire pour réduire le risque.
5. Traiter les erreurs SQL de façon déterministe (pas de 500 "opaque").
6. Valider chaque étape avec tests et smoke tests HTTP.
7. Ajouter des migrations idempotentes (`IF NOT EXISTS`) quand pertinent.
8. Ne pas supposer que le schéma reflète l'UI: vérifier systématiquement.
9. Garder la sécurité d'abord:
   - whitelist table
   - validation des identifiants SQL
   - protections auth/autorisation cohérentes
10. Documenter immédiatement chaque correctif structurel dans le manifest.

---

## 5) Commandes opératoires standard

### Setup et validation

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:deploy
npm run typecheck
npm run test
npm run build
```

### Debug migration DB

```bash
npm run prisma:migrate:status
npm run prisma:studio
```

### Smoke tests API (exemples)

```bash
# lecture
curl -s "http://localhost:3000/api/db/events?select=id,name&limit=5"

# écriture
curl -s -X POST "http://localhost:3000/api/db/events" \
  -H "content-type: application/json" \
  -d '{"values":{"name":"Event test","status":"upcoming"}}'
```

---

## 6) Définition de terminé (Definition of Done)

La migration est "terminée" seulement si tout est vrai:

- Les flux auth et CRUD critiques fonctionnent sous Next.
- Plus aucun 500 prévisible sur erreurs de schéma/colonnes/types.
- `typecheck`, `test`, `build` sont verts.
- Les migrations Prisma sont appliquées et traçables.
- Le manifest est mis à jour avec:
  - ce qui a été fait
  - ce qui reste
  - les risques ouverts

---

## 7) État restant sur ce projet (post-migration actuelle)

Travaux encore recommandés:

- Remplacer progressivement le shell SPA catch-all par des segments App Router natifs.
- Remplacer le bridge DB générique par des routes métier dédiées (domain-first API).
- Renforcer les règles d'autorisation table/ligne pour reproduire les garanties de sécurité attendues.
- Finaliser l'architecture de jobs (cron/worker/retry/monitoring).
- Mettre en place une stratégie realtime (SSE/WebSocket/polling) selon les besoins produit.

---

## 8) Prompt prêt à l'emploi pour un autre agent

Tu peux utiliser ce prompt pour lancer un autre agent sur un projet similaire:

"Exécute une migration incrémentale React/Vite/Supabase vers Next.js/PostgreSQL/Prisma. Respecte ce manifest: audit des tables UI, bridge de compatibilité frontend, routes API auth, route DB sécurisée avec validation `information_schema`, cast SQL typés, mapping erreurs PG->HTTP, migrations Prisma alignées avec les champs UI, puis validation stricte (`typecheck`, `test`, `build` + smoke tests HTTP). Documente chaque correction structurelle et n'introduis pas de régression fonctionnelle."
