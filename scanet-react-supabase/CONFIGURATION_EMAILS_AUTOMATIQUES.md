# Configuration des Emails Automatiques

## Vue d'ensemble

Le système d'envoi automatique d'emails planifiés fonctionne en utilisant :
- **pg_cron** : Extension PostgreSQL qui exécute des tâches planifiées
- **Edge Function** : `process-scheduled-emails` qui gère l'envoi réel des emails
- **Resend** : Service d'envoi d'emails

## Étape 1 : Configuration de la base de données

### 1.1 Exécuter le script de configuration

Connectez-vous à votre base de données Supabase et exécutez les commandes suivantes :

```sql
-- Remplacez YOUR_SUPABASE_URL_HERE par votre URL Supabase
-- Exemple : https://yourproject.supabase.co
SELECT set_app_config('supabase_url', 'YOUR_SUPABASE_URL_HERE');

-- Remplacez YOUR_SERVICE_ROLE_KEY_HERE par votre clé service role
-- Vous la trouverez dans Dashboard > Settings > API
SELECT set_app_config('service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE');
```

### 1.2 Vérifier la configuration

```sql
-- Vérifier que les valeurs sont bien configurées
SELECT key,
       CASE
         WHEN key = 'service_role_key' THEN LEFT(value, 20) || '...'
         ELSE value
       END as value,
       updated_at
FROM app_config
WHERE key IN ('supabase_url', 'service_role_key');
```

### 1.3 Vérifier le cron job

```sql
-- Vérifier que le cron job est actif
SELECT jobid,
       jobname,
       schedule,
       command,
       active
FROM cron.job
WHERE jobname = 'process-scheduled-emails';
```

Si le cron job n'existe pas, vérifiez que l'extension `pg_cron` est bien activée :

```sql
-- Activer pg_cron si nécessaire
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Recréer le cron job
SELECT cron.schedule(
  'process-scheduled-emails',
  '* * * * *',
  'SELECT trigger_scheduled_email_processing();'
);
```

## Étape 2 : Configuration de Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Créez une clé API
3. Ajoutez la clé dans vos secrets Supabase :
   - Allez dans Dashboard > Edge Functions > Manage secrets
   - Ajoutez : `RESEND_API_KEY` avec votre clé

## Étape 3 : Déployer l'Edge Function

L'edge function `process-scheduled-emails` doit être déployée. Elle l'est normalement automatiquement, mais vous pouvez vérifier :

```bash
# Depuis votre terminal local
supabase functions list
```

Vous devriez voir `process-scheduled-emails` dans la liste.

## Fonctionnement du système

### Flux automatique

1. **Chaque minute**, le cron job `process-scheduled-emails` s'exécute
2. Il vérifie s'il y a des emails dont la date d'envoi est atteinte (`scheduled_for <= NOW()`)
3. Si oui, il appelle l'edge function `process-scheduled-emails`
4. L'edge function :
   - Récupère tous les emails en attente
   - Pour chaque email, envoie à tous les destinataires via Resend
   - Met à jour le statut des emails et destinataires
   - Crée des logs dans `email_logs`
   - Envoie des notifications à l'utilisateur

### Flux manuel

Vous pouvez aussi déclencher l'envoi manuellement depuis l'interface :
- Sur la page "Relances", cliquez sur le bouton "Traiter les emails en attente"
- Ou cliquez sur "Envoyer" dans la notification toast

## Tests

### Test manuel via SQL

```sql
-- Tester le traitement manuel des emails
SELECT manual_process_scheduled_emails();
```

### Test depuis l'interface

1. Créez un email planifié avec une date/heure dans le passé
2. Allez sur la page "Relances"
3. Vous devriez voir une notification indiquant qu'un email est prêt
4. Cliquez sur "Envoyer" pour tester

### Test du cron job

Le cron job s'exécute automatiquement toutes les minutes. Pour vérifier qu'il fonctionne :

1. Créez un email planifié pour dans 2 minutes
2. Attendez 2-3 minutes
3. Rechargez la page "Relances"
4. L'email devrait être passé de "pending" à "sent"

## Dépannage

### Le cron job ne s'exécute pas

```sql
-- Vérifier si pg_cron est activé
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Vérifier les logs du cron job
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-scheduled-emails')
ORDER BY start_time DESC
LIMIT 10;
```

### Les emails ne sont pas envoyés

1. Vérifiez que la configuration est correcte :
```sql
SELECT * FROM app_config;
```

2. Vérifiez les logs d'emails :
```sql
SELECT * FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

3. Vérifiez les emails planifiés :
```sql
SELECT id, subject, scheduled_for, status, error_message
FROM scheduled_emails
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### La clé Resend ne fonctionne pas

Vérifiez que :
1. La clé API est correctement configurée dans les secrets Supabase
2. Le domaine d'envoi est vérifié dans Resend
3. Vous n'avez pas atteint les limites de votre plan Resend

## Surveillance

### Emails en attente

```sql
-- Voir tous les emails en attente
SELECT id, subject, scheduled_for,
       (SELECT COUNT(*) FROM scheduled_email_recipients WHERE scheduled_email_id = scheduled_emails.id) as recipient_count
FROM scheduled_emails
WHERE status = 'pending'
ORDER BY scheduled_for;
```

### Emails envoyés aujourd'hui

```sql
-- Statistiques du jour
SELECT
  COUNT(*) as total_sent,
  COUNT(DISTINCT user_id) as unique_users,
  SUM((SELECT COUNT(*) FROM scheduled_email_recipients WHERE scheduled_email_id = scheduled_emails.id AND status = 'sent')) as total_recipients
FROM scheduled_emails
WHERE status = 'sent'
AND DATE(sent_at) = CURRENT_DATE;
```

### Taux d'échec

```sql
-- Voir les emails en échec
SELECT id, subject, scheduled_for, error_message
FROM scheduled_emails
WHERE status = 'failed'
ORDER BY scheduled_for DESC
LIMIT 20;
```

## Maintenance

### Nettoyer les anciens emails

```sql
-- Supprimer les emails envoyés il y a plus de 30 jours
DELETE FROM scheduled_emails
WHERE status = 'sent'
AND sent_at < NOW() - INTERVAL '30 days';
```

### Désactiver temporairement le système

```sql
-- Désactiver le cron job
SELECT cron.unschedule('process-scheduled-emails');

-- Pour le réactiver plus tard
SELECT cron.schedule(
  'process-scheduled-emails',
  '* * * * *',
  'SELECT trigger_scheduled_email_processing();'
);
```
