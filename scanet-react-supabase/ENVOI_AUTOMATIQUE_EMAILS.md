# Système d'Envoi Automatique des Emails Planifiés

## Vue d'ensemble

Le système d'envoi automatique des emails planifiés fonctionne de manière entièrement automatisée grâce à trois composants principaux :

### 1. Job Cron Automatique (pg_cron)

Un job cron s'exécute automatiquement **chaque minute** dans la base de données Supabase :

- **Déclenchement** : Toutes les minutes
- **Fonction** : `trigger_scheduled_email_processing()`
- **Action** : Vérifie s'il y a des emails dont la date/heure d'envoi est atteinte

### 2. Edge Function de Traitement

L'edge function `process-scheduled-emails` traite automatiquement les emails :

- **Récupération** : Sélectionne tous les emails avec statut `pending` et date <= maintenant
- **Traitement** : Envoie chaque email à ses destinataires via Resend
- **Logs** : Enregistre tous les envois dans `email_logs`
- **Mise à jour** : Change le statut de l'email (sent/failed)

### 3. Notifications Automatiques

Pour chaque email traité, le système envoie automatiquement des notifications :

#### En cas de succès
```
Titre: "Email envoyé avec succès"
Message: "X email(s) envoyé(s) avec succès: [Sujet]"
Type: success
```

#### En cas d'échec
```
Titre: "Échec d'envoi d'email"
Message: "X email(s) n'a/ont pas pu être envoyé(s): [Sujet]"
Type: error
```

## Fonctionnalités

### Édition des Emails Planifiés

Les utilisateurs peuvent modifier les emails planifiés tant qu'ils ont le statut `pending` :

- ✅ Modifier l'objet
- ✅ Modifier le message
- ✅ Changer la date/heure d'envoi
- ❌ Les destinataires ne peuvent pas être modifiés après création

### Statuts des Emails

- **pending** : En attente d'envoi
- **sent** : Envoyé avec succès
- **failed** : Échec de l'envoi
- **cancelled** : Annulé par l'utilisateur

### Interface Responsive

La page Relances est entièrement responsive avec :

- Grille adaptative (2 colonnes sur mobile, 4 sur desktop)
- Boutons et textes ajustés selon la taille d'écran
- Filtres avec scroll horizontal sur mobile
- Modal d'édition optimisé pour tous les écrans

## Architecture Technique

### Tables de Base de Données

1. **scheduled_emails** : Emails planifiés
2. **scheduled_email_recipients** : Destinataires de chaque email
3. **email_logs** : Historique de tous les envois
4. **notifications** : Notifications utilisateur

### Flux de Traitement

```
1. Cron Job (chaque minute)
   ↓
2. Vérifie les emails dus
   ↓
3. Appelle Edge Function via HTTP
   ↓
4. Edge Function traite les emails
   ↓
5. Envoie via Resend API
   ↓
6. Met à jour les statuts
   ↓
7. Crée les notifications
   ↓
8. Mise à jour en temps réel via Supabase Realtime
```

## Temps Réel

Grâce aux subscriptions Supabase Realtime, l'interface se met à jour automatiquement :

- Changement de statut (pending → sent/failed)
- Ajout de nouvelles relances
- Modifications d'emails existants
- Suppressions

Plus besoin de rafraîchir la page !

## Sécurité

- Le cron job utilise le **service role key** pour accéder à tous les emails
- Les utilisateurs ne peuvent accéder qu'à leurs propres emails
- Les notifications sont créées avec le bon `user_id`
- Toutes les tables ont des politiques RLS actives
