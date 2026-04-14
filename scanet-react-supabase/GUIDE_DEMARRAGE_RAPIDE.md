# Guide de démarrage rapide - Emails automatiques

## Configuration en 3 étapes simples

### Étape 1 : Trouver vos identifiants Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Notez :
   - **Project URL** (exemple : `https://xxxxxxxxxxxxx.supabase.co`)
   - **Service Role Key** (cliquez sur "Reveal" pour la voir)

### Étape 2 : Configurer la base de données

1. Dans votre dashboard Supabase, allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez-collez le code ci-dessous EN REMPLAÇANT les valeurs par les vôtres :

```sql
-- REMPLACEZ https://xxxxx.supabase.co par VOTRE URL
SELECT set_app_config('supabase_url', 'https://xxxxxxxxxxxxx.supabase.co');

-- REMPLACEZ la clé ci-dessous par VOTRE SERVICE ROLE KEY
SELECT set_app_config('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

-- Vérifier que ça fonctionne
SELECT 'Configuration OK' as status, key,
       CASE WHEN key = 'service_role_key'
            THEN LEFT(value, 20) || '...'
            ELSE value
       END as value
FROM app_config
WHERE key IN ('supabase_url', 'service_role_key');
```

4. Exécutez la requête
5. Vous devriez voir : "Configuration OK" avec vos valeurs

### Étape 3 : Configurer Resend

1. Créez un compte gratuit sur https://resend.com
2. Créez une clé API
3. Dans Supabase, allez dans **Edge Functions** > **Manage secrets**
4. Ajoutez un nouveau secret :
   - Nom : `RESEND_API_KEY`
   - Valeur : votre clé Resend

### C'est tout !

Le système est maintenant configuré. Les emails planifiés seront automatiquement envoyés toutes les minutes.

## Tester que ça fonctionne

### Test rapide

1. Allez sur la page **Relances**
2. Cliquez sur **Planifier une relance**
3. Créez un email avec une date/heure dans 2 minutes
4. Attendez 2-3 minutes
5. Rafraîchissez la page
6. L'email devrait être passé au statut "Envoyé ✅"

### Test manuel immédiat

Dans le SQL Editor de Supabase :

```sql
-- Créer un email de test
INSERT INTO scheduled_emails (user_id, subject, body, scheduled_for, status)
VALUES (
  auth.uid(),
  'Test email',
  'Ceci est un email de test',
  NOW() - INTERVAL '1 minute',  -- Dans le passé pour envoi immédiat
  'pending'
);

-- Ajouter un destinataire
INSERT INTO scheduled_email_recipients (scheduled_email_id, email, status)
SELECT id, 'votre-email@example.com', 'pending'
FROM scheduled_emails
WHERE subject = 'Test email'
ORDER BY created_at DESC
LIMIT 1;

-- Déclencher l'envoi
SELECT manual_process_scheduled_emails();
```

## Vérifier le cron job

Pour vérifier que le système automatique fonctionne :

```sql
-- Voir si le cron job est actif
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'process-scheduled-emails';
```

Vous devriez voir :
- `jobname`: process-scheduled-emails
- `schedule`: * * * * * (toutes les minutes)
- `active`: true

## Besoin d'aide ?

Si quelque chose ne fonctionne pas, consultez :
- `CORRECTIONS_EMAILS.md` - Explications détaillées des corrections
- `CONFIGURATION_EMAILS_AUTOMATIQUES.md` - Guide complet de configuration et dépannage

## Questions fréquentes

### Q: Les emails ne sont pas envoyés

**R:** Vérifiez que :
1. La configuration est bien faite : `SELECT * FROM app_config;`
2. Le cron job est actif (voir requête ci-dessus)
3. Resend est configuré dans les secrets
4. L'email a une date dans le passé : `SELECT * FROM scheduled_emails WHERE status = 'pending';`

### Q: Comment voir les logs d'envoi ?

**R:** Exécutez :
```sql
SELECT to_email, subject, status, sent_at, error_message
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Q: Comment annuler un email planifié ?

**R:** Via l'interface sur la page Relances, ou via SQL :
```sql
UPDATE scheduled_emails
SET status = 'cancelled'
WHERE id = 'votre-id-email';
```

### Q: Combien d'emails puis-je envoyer ?

**R:** Cela dépend de votre plan Resend :
- Gratuit : 100 emails/jour
- Pro : À partir de 50 000 emails/mois

Le système gère automatiquement les limites et retente en cas d'échec.
