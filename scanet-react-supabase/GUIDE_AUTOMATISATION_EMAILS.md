# Guide d'automatisation des emails planifiés

Ce guide explique comment fonctionne l'automatisation des emails planifiés et comment la configurer.

## Architecture du système

Le système d'automatisation utilise **trois méthodes complémentaires** pour garantir l'envoi des emails :

### 1. pg_cron (Automatisation serveur)
- **Idéal** : Fonctionne même si personne n'est connecté
- **Disponibilité** : Nécessite Supabase Pro ou Enterprise
- **Fréquence** : Toutes les minutes
- **Configuration** : Automatique via les migrations

### 2. Service côté client (Automatisation navigateur)
- **Fallback** : Fonctionne quand un utilisateur est connecté
- **Disponibilité** : Tous les plans Supabase
- **Fréquence** : Toutes les minutes pendant que l'utilisateur navigue
- **Configuration** : Automatique, aucune action requise

### 3. Webhook externe (Option manuelle)
- **Alternative** : Utilise un service externe comme cron-job.org
- **Disponibilité** : Tous les plans
- **Fréquence** : Configurable
- **Configuration** : Manuelle (voir instructions ci-dessous)

## Configuration automatique

### Étape 1 : Vérifier le statut du système

Exécutez cette requête SQL dans l'éditeur Supabase :

```sql
SELECT * FROM check_cron_status();
```

Résultat attendu :
- `cron_available` : true si pg_cron est disponible
- `cron_scheduled` : true si le cron job est programmé
- `pending_emails_count` : nombre d'emails en attente
- `due_emails_count` : nombre d'emails à envoyer maintenant
- `config_status` : statut de la configuration

### Étape 2 : Configurer les clés (si nécessaire)

Si `config_status` indique que les clés ne sont pas configurées, exécutez :

```sql
-- Remplacez par vos vraies valeurs
SELECT set_app_config('supabase_url', 'https://your-project.supabase.co');
SELECT set_app_config('service_role_key', 'your-service-role-key-here');
```

**Où trouver ces valeurs ?**
- Supabase Dashboard → Settings → API
- `SUPABASE_URL` : Project URL
- `service_role_key` : service_role key (⚠️ Ne jamais exposer côté client)

### Étape 3 : Vérifier que pg_cron est activé (Plan Pro)

Si vous avez Supabase Pro ou Enterprise :

```sql
-- Vérifier si pg_cron est installé
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Voir les cron jobs actifs
SELECT * FROM cron.job;
```

Si pg_cron n'est pas disponible, le système utilisera automatiquement le fallback côté client.

## Test du système

### Test 1 : Vérification de configuration

```sql
-- Affiche le statut complet du système
SELECT * FROM check_cron_status();
```

### Test 2 : Déclenchement manuel

Exécutez dans Supabase SQL Editor :

```sql
-- Déclenche le traitement immédiat des emails en attente
SELECT * FROM manual_process_scheduled_emails();
```

### Test 3 : Planifier un email de test

1. Allez dans l'onglet "Relances" de l'application
2. Cliquez sur "Planifier une relance"
3. Sélectionnez un contact
4. Saisissez un sujet et un message
5. Planifiez pour dans **2 minutes**
6. Attendez 3 minutes et vérifiez que l'email est envoyé

### Test 4 : Appel direct de la fonction edge

```bash
# Remplacez YOUR_PROJECT_URL et YOUR_SERVICE_ROLE_KEY
curl -X POST \
  'https://YOUR_PROJECT_URL.supabase.co/functions/v1/process-scheduled-emails' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## Configuration d'un webhook externe (Optionnel)

Si vous n'avez pas pg_cron et voulez que les emails s'envoient même sans utilisateur connecté, utilisez un service de cron externe.

### Avec cron-job.org (Gratuit)

1. Créez un compte sur https://cron-job.org
2. Créez un nouveau cron job avec ces paramètres :
   - **URL** : `https://YOUR_PROJECT.supabase.co/functions/v1/process-scheduled-emails`
   - **Méthode** : POST
   - **Headers** :
     - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
     - `Content-Type: application/json`
   - **Fréquence** : Toutes les minutes (`* * * * *`)
3. Activez le job

### Avec GitHub Actions (Gratuit)

Créez `.github/workflows/process-emails.yml` :

```yaml
name: Process Scheduled Emails

on:
  schedule:
    - cron: '* * * * *'  # Toutes les minutes
  workflow_dispatch:

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger email processing
        run: |
          curl -X POST \
            '${{ secrets.SUPABASE_URL }}/functions/v1/process-scheduled-emails' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json'
```

Ajoutez les secrets dans Settings → Secrets → Actions :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Monitoring et dépannage

### Voir les logs de cron

```sql
-- Voir l'historique d'exécution (si pg_cron est actif)
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-scheduled-emails')
ORDER BY start_time DESC
LIMIT 10;
```

### Voir les emails en attente

```sql
SELECT
  id,
  subject,
  scheduled_for,
  status,
  created_at,
  scheduled_for <= NOW() as is_due
FROM scheduled_emails
WHERE status = 'pending'
ORDER BY scheduled_for;
```

### Voir les logs d'envoi

```sql
SELECT
  created_at,
  to_email,
  subject,
  status,
  error_message
FROM email_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Problèmes courants

#### Les emails ne sont pas envoyés

1. Vérifiez que `RESEND_API_KEY` est configurée dans les variables d'environnement
2. Vérifiez le statut : `SELECT * FROM check_cron_status();`
3. Testez manuellement : `SELECT * FROM manual_process_scheduled_emails();`
4. Vérifiez les logs de la fonction edge dans Supabase Dashboard

#### pg_cron n'est pas disponible

C'est normal sur le plan gratuit. Le système utilisera automatiquement :
- Le service côté client (quand un utilisateur est connecté)
- Ou configurez un webhook externe (voir ci-dessus)

#### Les heures ne correspondent pas

Les heures sont stockées en UTC dans la base de données mais affichées en heure locale dans l'interface. C'est normal et correct.

Pour vérifier :
```sql
-- Heure actuelle de la base de données (UTC)
SELECT NOW();

-- Emails dus (comparison en UTC)
SELECT * FROM scheduled_emails
WHERE status = 'pending'
AND scheduled_for <= NOW();
```

## Fonctionnement technique

### Flux d'exécution

1. **Déclencheur** (une des trois méthodes)
   - pg_cron : `trigger_scheduled_email_processing()` toutes les minutes
   - Client : `emailAutomationService` vérifie toutes les minutes
   - Webhook : appel HTTP externe

2. **Vérification**
   - Compte les emails où `scheduled_for <= NOW()` et `status = 'pending'`

3. **Traitement**
   - Appelle la fonction edge `process-scheduled-emails`
   - Envoie les emails via Resend
   - Met à jour le statut dans la base

4. **Notification**
   - Crée une notification pour l'utilisateur
   - Met à jour l'interface en temps réel via Realtime

### Sécurité

- Les clés sont stockées dans `app_config` avec RLS
- Seul le service_role peut y accéder
- Les fonctions utilisent SECURITY DEFINER
- Les appels externes nécessitent la service_role key

## FAQ

**Q: Combien coûte l'automatisation ?**
R:
- Service client : Gratuit (inclus dans tous les plans)
- pg_cron : Nécessite Supabase Pro ($25/mois)
- Webhook externe : Gratuit avec cron-job.org ou GitHub Actions

**Q: Quelle méthode choisir ?**
R:
- **Plan gratuit** : Service client + webhook externe
- **Plan Pro** : pg_cron (automatique)
- **Usage léger** : Service client suffit

**Q: Les emails sont-ils garantis ?**
R: Avec pg_cron ou webhook externe, oui. Avec le service client seulement, quelqu'un doit avoir l'application ouverte.

**Q: Peut-on modifier la fréquence ?**
R: Oui, modifiez le cron expression :
- Toutes les 5 min : `*/5 * * * *`
- Toutes les 15 min : `*/15 * * * *`
- Toutes les heures : `0 * * * *`

**Q: Comment désactiver l'automatisation ?**
R:
```sql
-- Désactiver pg_cron
SELECT cron.unschedule('process-scheduled-emails');
```

Pour le service client, il se désactive automatiquement quand on ferme l'application.
