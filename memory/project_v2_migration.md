---
name: project-v2-migration
description: MLStock V2 — migration ERP logistique/financier secteur public, changements de schémas Mongoose en cours
metadata:
  type: project
---

MLStock passe en V2 suite aux retours du jury : ERP logistique et financier pour le secteur public avec traçabilité rigoureuse. Migrations par étapes chirurgicales.

**Missions complétées (2026-05-25) :**

- **Mission 1 — User.js RBAC granulaire** : remplacement du champ `role` (enum textuel) par `permissions` subdocument avec 4 booléens : `canDemand`, `canReceive`, `canDispatch`, `isAdmin`. Fichier : `server/models/User.js`.

- **Mission 2 — Lot.js Finances & typeProduit** : 
  - `type` (`semence/azote/materiel`) → `typeProduit` (`Conventionnelle/Sexée/Azote`) required
  - Ajout `uniteMesure` (`Unité/Litre`) required
  - Ajout `prixAchatUnitaire` (Number, required, min:0)
  - `fournisseurId` rendu required (existait déjà)
  - ficheTechniqueSchema : `cuve` → `conteneurSemence`
  - Fichier : `server/models/Lot.js`

**Migration en attente (couche routes/contrôleurs) :**
- `authMiddleware.js`, `auth.js`, `quotas.js`, `transactionController.js` utilisent encore `user.role` → à migrer vers `user.permissions.*`
- `approvisionnementController.js:213` crée des Lots avec `type:` (ancien enum) → à migrer vers `typeProduit:`
- `dashboard.js:49` filtre par `type: 'azote'` → à migrer vers `typeProduit: 'Azote'`
- `quotas.js:219` et `validations.js:167` référencent `ficheTechnique.cuve` → à migrer vers `conteneurSemence`

**Why:** Jury feedback — l'app doit être un ERP traçable pour le secteur public avec permissions granulaires et valeurs financières sur chaque lot.

**How to apply:** Proposer la migration couche par couche (middleware → routes → contrôleurs). Ne pas toucher backend/models/ (dossier parallèle non utilisé activement).
