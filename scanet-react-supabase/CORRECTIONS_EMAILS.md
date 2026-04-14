# Corrections apportées au système d'emails automatiques

## Problèmes corrigés

### 1. Envoi automatique d'emails non fonctionnel

**Problème :** Les emails planifiés n'étaient pas envoyés automatiquement même quand la date/heure était atteinte.

**Cause :** Le cron job ne pouvait pas accéder aux variables d'environnement nécessaires (URL Supabase et Service Role Key) via `current_setting()`.

**Solution :**
- Création d'une table `app_config` pour stocker la configuration
- Modification de la fonction `trigger_scheduled_email_processing()` pour lire depuis cette table
- Création de fonctions helper `set_app_config()` et `get_app_config()`
- Le cron job fonctionne maintenant correctement toutes les minutes

### 2. Notifications en double sur la page Relances

**Problème :** Chaque fois que la page se rafraîchissait ou qu'un événement se produisait, une notification toast en double apparaissait.

**Cause :** La fonction `checkForDueEmails()` affichait un toast à chaque appel, et elle était appelée :
- Au chargement du composant
- À chaque changement dans la base de données
- Toutes les minutes via setInterval
- Après le traitement des emails

**Solution :**
- Ajout d'un paramètre `showNotification` à la fonction `checkForDueEmails()`
- Seul le premier chargement affiche la notification
- Suivi des IDs d'emails déjà notifiés pour éviter les doublons
- Les autres appels mettent à jour silencieusement le compteur

## Fichiers modifiés

### 1. Migration de base de données
- **Fichier :** `supabase/migrations/fix_automatic_email_processing.sql`
- **Changements :**
  - Table `app_config` pour stocker la configuration
  - Fonction `set_app_config()` pour définir les valeurs
  - Fonction `get_app_config()` pour lire les valeurs
  - Fonction `trigger_scheduled_email_processing()` améliorée
  - Cron job reconfiguré

### 2. Composant Relances
- **Fichier :** `src/components/Relances.tsx`
- **Changements :**
  - Ajout du state `lastNotificationIds`
  - Paramètre `showNotification` dans `checkForDueEmails()`
  - Logique de déduplication des notifications
  - Seul le chargement initial affiche la notification

## Configuration requise

### Étape 1 : Configurer la base de données

Exécutez le script de configuration :

```bash
./configure-email-automation.sh
```

Ce script génère un fichier SQL avec vos variables d'environnement. Copiez et exécutez ce SQL dans votre console Supabase.

**OU** exécutez manuellement dans la console SQL Supabase :

```sql
-- Remplacez par vos vraies valeurs
SELECT set_app_config('supabase_url', 'https://votre-projet.supabase.co');
SELECT set_app_config('service_role_key', 'votre-service-role-key');

-- Vérifier la configuration
SELECT * FROM app_config;
```

### Étape 2 : Vérifier que le cron job est actif

```sql
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'process-scheduled-emails';
```

### Étape 3 : Configurer Resend (si pas déjà fait)

1. Créez un compte sur [Resend](https://resend.com)
2. Créez une clé API
3. Ajoutez-la dans les secrets Supabase :
   - Dashboard > Edge Functions > Manage secrets
   - `RESEND_API_KEY` = votre clé

## Test du système

### Test manuel

1. Créez un email planifié avec une date dans le passé
2. Allez sur la page "Relances"
3. Vous devriez voir UNE SEULE notification toast
4. Cliquez sur "Envoyer" pour déclencher l'envoi

### Test automatique

1. Créez un email planifié pour dans 2 minutes
2. Attendez 2-3 minutes
3. Rafraîchissez la page "Relances"
4. L'email devrait être passé au statut "sent"

### Test via SQL

```sql
-- Déclencher manuellement le traitement
SELECT manual_process_scheduled_emails();

-- Voir les résultats
SELECT id, subject, status, sent_at, error_message
FROM scheduled_emails
ORDER BY created_at DESC
LIMIT 5;
```

## Vérification de bon fonctionnement

### Vérifier le cron job

```sql
-- Voir les dernières exécutions du cron
SELECT job_id, start_time, end_time, status, return_message
FROM cron.job_run_details
WHERE job_id = (SELECT jobid FROM cron.job WHERE jobname = 'process-scheduled-emails')
ORDER BY start_time DESC
LIMIT 10;
```

### Vérifier les emails en attente

```sql
-- Emails qui devraient être envoyés
SELECT id, subject, scheduled_for, status,
       CASE
         WHEN scheduled_for <= NOW() THEN 'DUE'
         ELSE 'PENDING'
       END as should_send
FROM scheduled_emails
WHERE status = 'pending'
ORDER BY scheduled_for;
```

### Vérifier les logs d'envoi

```sql
-- Derniers emails envoyés
SELECT to_email, subject, status, sent_at, error_message
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

## Dépannage

### Le cron job ne s'exécute pas

**Vérifier pg_cron :**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

Si absent, l'activer :
```sql
CREATE EXTENSION pg_cron;
```

**Recréer le job :**
```sql
SELECT cron.schedule(
  'process-scheduled-emails',
  '* * * * *',
  'SELECT trigger_scheduled_email_processing();'
);
```

### Les emails ne sont pas envoyés

**1. Vérifier la configuration :**
```sql
SELECT * FROM app_config;
```

**2. Tester manuellement :**
```sql
SELECT manual_process_scheduled_emails();
```

**3. Voir les erreurs :**
```sql
SELECT id, subject, error_message
FROM scheduled_emails
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Les notifications apparaissent toujours en double

- Videz le cache du navigateur
- Fermez et rouvrez l'application
- Vérifiez que les changements sont bien déployés

## Documentation complémentaire

Pour plus de détails, consultez :
- `CONFIGURATION_EMAILS_AUTOMATIQUES.md` : Guide complet de configuration
- `setup-email-automation.sql` : Script SQL de configuration
- `configure-email-automation.sh` : Script bash de génération automatique

## Résumé des améliorations

✅ **Envoi automatique fonctionnel** : Les emails sont maintenant envoyés automatiquement toutes les minutes quand leur date est atteinte

✅ **Configuration persistante** : Les variables de configuration sont stockées en base de données

✅ **Notifications uniques** : Plus de notifications en double sur la page Relances

✅ **Scripts d'aide** : Scripts automatisés pour faciliter la configuration

✅ **Documentation complète** : Guides détaillés pour la configuration et le dépannage

✅ **Testabilité** : Fonctions manuelles pour tester le système sans attendre
