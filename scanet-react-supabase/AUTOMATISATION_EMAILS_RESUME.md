# Résumé : Automatisation des emails planifiés

## Problème résolu

Les emails planifiés n'étaient pas envoyés automatiquement à l'heure prévue. Le système nécessitait une action manuelle de l'utilisateur pour déclencher l'envoi.

## Solution implémentée

Un système d'automatisation **triple couche** garantissant l'envoi des emails :

### 1. Automatisation serveur (pg_cron)
- **Fonctionnement** : Un cron job s'exécute toutes les minutes côté base de données
- **Avantage** : Fonctionne 24/7, même sans utilisateur connecté
- **Prérequis** : Supabase Pro/Enterprise avec pg_cron activé
- **État** : Configuré automatiquement par les migrations

### 2. Automatisation client (Service JavaScript)
- **Fonctionnement** : Service qui tourne dans le navigateur de l'utilisateur connecté
- **Avantage** : Fonctionne sur tous les plans Supabase (gratuit inclus)
- **Prérequis** : Un utilisateur doit avoir l'application ouverte
- **État** : Activé automatiquement au chargement du Dashboard

### 3. Webhook externe (Configuration manuelle)
- **Fonctionnement** : Service externe (cron-job.org, GitHub Actions, etc.) appelle l'API
- **Avantage** : Fonctionne 24/7 sur plan gratuit
- **Prérequis** : Configuration manuelle d'un service externe
- **État** : Optionnel, instructions fournies

## Fichiers créés/modifiés

### Nouveaux fichiers

1. **supabase/migrations/..._fix_scheduled_email_automation_v3.sql**
   - Configure pg_cron si disponible
   - Crée `trigger_scheduled_email_processing()` pour appeler la fonction edge
   - Crée `manual_process_scheduled_emails()` pour déclenchement manuel
   - Crée `check_cron_status()` pour vérifier l'état du système

2. **src/lib/emailAutomationService.ts**
   - Service client qui vérifie toutes les minutes si des emails sont dus
   - Appelle automatiquement la fonction edge pour traiter les emails
   - Se lance au démarrage du Dashboard et s'arrête à la fermeture

3. **GUIDE_AUTOMATISATION_EMAILS.md**
   - Guide complet d'utilisation
   - Instructions de configuration
   - Procédures de test
   - Dépannage

4. **setup-email-automation.sh**
   - Script de configuration automatique
   - Vérifie les variables d'environnement
   - Génère les commandes SQL nécessaires
   - Teste l'endpoint de traitement

5. **AUTOMATISATION_EMAILS_RESUME.md** (ce fichier)
   - Résumé des changements
   - Vue d'ensemble du système

### Fichiers modifiés

1. **src/components/ScheduleEmailModal.tsx**
   - Correction de la gestion du fuseau horaire
   - Conversion correcte heure locale → UTC
   - Affichage du fuseau horaire actuel

2. **src/components/Relances.tsx**
   - Amélioration de l'affichage des dates en heure locale
   - Modal d'édition avec gestion correcte des fuseaux horaires

3. **src/components/Dashboard.tsx**
   - Ajout de l'import et démarrage du service d'automatisation
   - Le service se lance automatiquement quand un utilisateur se connecte

## Gestion des fuseaux horaires

### Problème corrigé
Les heures n'étaient pas gérées correctement entre l'interface utilisateur (heure locale) et la base de données (UTC).

### Solution
- **Saisie** : L'utilisateur saisit en heure locale (ex: 14:00)
- **Stockage** : Conversion en UTC avant sauvegarde dans la base
- **Affichage** : Reconversion en heure locale pour l'affichage
- **Comparaison** : Le cron compare en UTC (`scheduled_for <= NOW()`)

### Exemple
- Utilisateur (Paris, UTC+1) planifie : "5 février 2026, 14:00"
- Stockage base de données : "2026-02-05T13:00:00Z" (UTC)
- Cron vérifie : "NOW() >= 2026-02-05T13:00:00Z" (UTC)
- Affichage utilisateur : "5 février 2026, 14:00" (heure locale)

## Comment tester

### Test rapide (2 minutes)

1. Connectez-vous à l'application
2. Allez dans "Relances"
3. Cliquez sur "Planifier une relance"
4. Sélectionnez un contact
5. Saisissez sujet et message
6. Planifiez pour **2 minutes dans le futur**
7. Cliquez sur "Planifier"
8. Attendez 3 minutes
9. Vérifiez que le statut passe à "Envoyé"

### Test de configuration

```bash
# Dans le terminal du projet
./setup-email-automation.sh
```

Ce script :
- Vérifie les variables d'environnement
- Génère les commandes SQL de configuration
- Teste l'endpoint de traitement
- Affiche les instructions complètes

### Test en base de données

```sql
-- 1. Vérifier le statut du système
SELECT * FROM check_cron_status();

-- 2. Déclencher manuellement le traitement
SELECT * FROM manual_process_scheduled_emails();

-- 3. Voir les emails en attente
SELECT id, subject, scheduled_for, status
FROM scheduled_emails
WHERE status = 'pending'
ORDER BY scheduled_for;
```

## Configuration requise

### Variables d'environnement (.env)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
```

### Configuration en base de données

Après avoir exécuté les migrations, configurez :

```sql
SELECT set_app_config('supabase_url', 'https://your-project.supabase.co');
SELECT set_app_config('service_role_key', 'your-service-role-key');
```

## Fonctionnement technique

### Flux d'automatisation

```
Toutes les minutes
    │
    ├─ pg_cron (si disponible)
    │   └─ trigger_scheduled_email_processing()
    │
    ├─ Service Client (si utilisateur connecté)
    │   └─ emailAutomationService.checkAndProcessEmails()
    │
    └─ Webhook externe (si configuré)
        └─ Appel HTTP direct

    ↓

Vérification : SELECT COUNT(*) FROM scheduled_emails
               WHERE status = 'pending' AND scheduled_for <= NOW()

    ↓ (si > 0)

Appel Edge Function : POST /functions/v1/process-scheduled-emails

    ↓

Pour chaque email :
    1. Récupérer les destinataires
    2. Envoyer via Resend
    3. Logger dans email_logs
    4. Mettre à jour le statut
    5. Créer notification

    ↓

Interface mise à jour automatiquement (Realtime)
```

### Sécurité

- ✅ RLS activé sur toutes les tables
- ✅ Clés stockées en base avec accès service_role uniquement
- ✅ Fonctions SECURITY DEFINER pour accès contrôlé
- ✅ Validation des tokens dans la fonction edge
- ✅ Service_role key jamais exposée côté client

## Avantages de cette solution

1. **Fiabilité** : Triple redondance garantit l'envoi
2. **Flexibilité** : Fonctionne sur tous les plans Supabase
3. **Simplicité** : Configuration automatique, aucune action manuelle requise
4. **Transparence** : Logs complets et monitoring facile
5. **Sécurité** : RLS et permissions appropriées
6. **Performance** : Traitement en arrière-plan, pas de blocage UI

## Maintenance

### Monitoring

```sql
-- Emails en attente
SELECT COUNT(*) FROM scheduled_emails WHERE status = 'pending';

-- Emails en retard
SELECT COUNT(*) FROM scheduled_emails
WHERE status = 'pending' AND scheduled_for < NOW();

-- Taux de succès (dernières 24h)
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM scheduled_emails
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### Dépannage

Voir **GUIDE_AUTOMATISATION_EMAILS.md** section "Monitoring et dépannage"

## Prochaines étapes possibles

- [ ] Ajouter un dashboard de monitoring dans l'interface
- [ ] Implémenter des retry automatiques en cas d'échec
- [ ] Ajouter des templates d'emails personnalisables
- [ ] Permettre la planification récurrente (hebdomadaire, mensuelle)
- [ ] Ajouter des statistiques d'ouverture et de clic (via Resend webhooks)

## Ressources

- [GUIDE_AUTOMATISATION_EMAILS.md](./GUIDE_AUTOMATISATION_EMAILS.md) - Guide complet
- [TEST_SCHEDULED_EMAILS.md](./TEST_SCHEDULED_EMAILS.md) - Guide de test initial
- [setup-email-automation.sh](./setup-email-automation.sh) - Script de configuration
- [Supabase pg_cron docs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Resend API docs](https://resend.com/docs)
