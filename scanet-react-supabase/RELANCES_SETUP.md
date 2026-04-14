# Configuration de l'envoi automatique des emails planifiés

## Fonctionnement actuel

L'application vérifie automatiquement toutes les minutes s'il y a des emails planifiés à envoyer. Lorsqu'un email est dû, une notification toast apparaît avec un bouton "Envoyer" permettant de déclencher l'envoi immédiatement.

## Option 1 : Envoi manuel depuis l'interface

1. **Vérification automatique** : L'application vérifie les emails dus toutes les minutes
2. **Notification** : Une notification toast s'affiche avec le nombre d'emails prêts
3. **Bouton d'action** : Cliquez sur "Envoyer" dans la notification ou sur le bouton vert "Envoyer X emails" dans la page Relances

## Option 2 : Automatisation via cron externe (Recommandé pour production)

Pour un envoi totalement automatique sans intervention manuelle, vous pouvez configurer un cron job externe qui appelle l'API.

### Configuration avec cron (Linux/Mac)

1. Créez un script shell `process-emails.sh` :

```bash
#!/bin/bash

# Remplacez par votre URL Supabase et votre service role key
SUPABASE_URL="https://votre-projet.supabase.co"
SERVICE_ROLE_KEY="votre-service-role-key"

curl -X POST \
  "${SUPABASE_URL}/functions/v1/process-scheduled-emails" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{}'
```

2. Rendez le script exécutable :
```bash
chmod +x process-emails.sh
```

3. Ajoutez une tâche cron (exécution toutes les minutes) :
```bash
crontab -e
```

Ajoutez cette ligne :
```
* * * * * /chemin/vers/process-emails.sh >> /var/log/scheduled-emails.log 2>&1
```

### Configuration avec GitHub Actions

Créez `.github/workflows/process-scheduled-emails.yml` :

```yaml
name: Process Scheduled Emails

on:
  schedule:
    # Exécuter toutes les 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  process-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/process-scheduled-emails" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -d '{}'
```

N'oubliez pas d'ajouter les secrets dans votre repository GitHub :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Configuration avec un service externe (EasyCron, cron-job.org)

1. Créez un compte sur [cron-job.org](https://cron-job.org) ou [EasyCron](https://www.easycron.com)

2. Configurez un nouveau job avec :
   - **URL** : `https://votre-projet.supabase.co/functions/v1/process-scheduled-emails`
   - **Method** : POST
   - **Headers** :
     - `Content-Type: application/json`
     - `Authorization: Bearer VOTRE_SERVICE_ROLE_KEY`
   - **Body** : `{}`
   - **Frequency** : Toutes les minutes ou 5 minutes

## Option 3 : Configuration avec pg_cron (Avancé)

Si vous avez un plan Supabase Pro ou supérieur, vous pouvez utiliser pg_cron directement dans Postgres.

### Via le Dashboard Supabase

1. Allez dans **Database** → **Extensions**
2. Activez l'extension `pg_cron`
3. Exécutez ce SQL dans l'éditeur SQL :

```sql
-- Créer une fonction wrapper qui appelle l'edge function
SELECT cron.schedule(
  'process-scheduled-emails',  -- nom du job
  '* * * * *',                  -- toutes les minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-scheduled-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### Vérifier les jobs cron

```sql
-- Voir tous les jobs cron
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

## Logs et monitoring

Les emails envoyés sont automatiquement enregistrés dans la table `email_logs` avec :
- Le statut (sent/failed)
- L'heure d'envoi
- Les erreurs éventuelles
- Les métadonnées

Pour consulter les logs :

```sql
SELECT
  to_email,
  subject,
  status,
  sent_at,
  error_message
FROM email_logs
WHERE template_type = 'follow_up'
ORDER BY created_at DESC
LIMIT 50;
```

## Dépannage

### Les emails ne s'envoient pas

1. Vérifiez que la clé API Resend est configurée dans les secrets de la fonction Edge
2. Vérifiez que les dates/heures des emails sont bien dans le passé
3. Consultez les logs dans la table `scheduled_email_cron_log`
4. Vérifiez manuellement en appelant l'API :

```bash
curl -X POST \
  "https://votre-projet.supabase.co/functions/v1/process-scheduled-emails" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_SERVICE_ROLE_KEY"
```

### Notifications de succès/échec

L'application affiche automatiquement des notifications toast :
- ✅ Succès : Nombre d'emails envoyés
- ❌ Échec : Nombre d'emails en erreur avec le message d'erreur

Ces notifications apparaissent dans l'interface après le traitement des emails.
