# ScaNetwork - Figma Design Scripts (6 scripts)

## Fichier Figma cible

**URL :** https://www.figma.com/design/lPYa1PWNvuMzu6wWITbEPC

Le fichier contient 3 pages : **Auth Flow**, **Main App**, **Views & Modals**.

---

## Comment exécuter les scripts

1. Ouvrir le fichier Figma ci-dessus
2. **Menu → Plugins → Development → Open Console**
3. Copier le contenu d'**un script** (commencer par `01-auth-login.js`)
4. Coller dans la console Figma et appuyer sur **Entrée**
5. Attendre la notification ✅ de fin
6. **Répéter** pour chaque script dans l'ordre (01 → 06)

> ⚠️ Exécuter les scripts **un par un** dans l'ordre. Chaque script est indépendant et crée ses frames sur la bonne page automatiquement.

---

## Scripts disponibles

| # | Fichier | Page Figma | Contenu |
|---|---------|-----------|---------|
| 1 | `01-auth-login.js` | Auth Flow | Page Login desktop (split-screen : branding + formulaire) |
| 2 | `02-auth-signup-forgot-reset-join.js` | Auth Flow | Signup, Mot de passe oublié, Réinitialisation, Rejoindre événement |
| 3 | `03-dashboard-sidebar.js` | Main App | Dashboard complet : sidebar, hero, KPIs, actions rapides, contacts récents, événements |
| 4 | `04-contacts-view.js` | Main App | Vue Contacts : hero, stats, status tabs, toolbar, grille de cartes contacts |
| 5 | `05-events-settings.js` | Main App | Liste événements (6 cartes) + Page Paramètres (profil, notifications, toggles) |
| 6 | `06-modals.js` | Views & Modals | 4 modals : AddContact, AddEvent, ScanContact, EventQRCode |

---

## Design tokens utilisés

| Token | Valeur |
|-------|--------|
| Primary | `#0E3A5D` |
| Accent | `#1e5a8e` |
| Font | Inter (Regular, Medium, Semi Bold, Bold) |
| Border radius | 12px / 16px / 24px / 32px |
| Status Lead | Orange `#EA580C` |
| Status Prospect | Amber `#D97706` |
| Status Client | Emerald `#059669` |
| Status Partenaire | Violet `#7C3AED` |
| Status Collaborateur | Cyan `#0891B2` |
| Status Ami | Pink `#EC4899` |
