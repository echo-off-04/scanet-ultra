# Guide de test des emails planifiés

## Vérifications effectuées

### 1. Gestion du fuseau horaire
- ✅ **ScheduleEmailModal** : Les heures sont maintenant saisies en heure locale et correctement converties en UTC pour le stockage
- ✅ **Relances** : Les heures sont affichées en heure locale de l'utilisateur
- ✅ **Modal d'édition** : Les heures sont affichées et modifiées en heure locale

### 2. Traitement automatique
- ✅ **process-scheduled-emails** : Compare les dates en UTC (cohérent avec le stockage)
- ✅ **Cron job** : S'exécute toutes les minutes pour traiter les emails dus

## Comment tester

### Test 1 : Planifier un email pour dans 2 minutes
1. Aller dans "Relances"
2. Cliquer sur "Planifier une relance"
3. Sélectionner au moins un contact
4. Saisir un sujet et un message
5. Sélectionner la date d'aujourd'hui et une heure dans 2 minutes (heure locale)
6. Cliquer sur "Planifier"
7. Attendre 2-3 minutes et vérifier que l'email passe au statut "Envoyé"

### Test 2 : Vérifier l'affichage de l'heure
1. Créer un email planifié pour demain à 14h00 (heure locale)
2. Vérifier dans la liste que l'heure affichée est bien 14h00
3. Éditer l'email et vérifier que l'heure dans le formulaire est bien 14h00
4. Vérifier dans la base de données que l'heure est stockée en UTC

### Test 3 : Traitement manuel
Vous pouvez déclencher manuellement le traitement via l'API :

```bash
curl -X POST \
  'YOUR_SUPABASE_URL/functions/v1/process-scheduled-emails' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

## Vérification de la configuration

### Vérifier que le cron job est actif
Exécuter dans Supabase SQL Editor :
```sql
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-emails';
```

### Vérifier les emails en attente
```sql
SELECT id, subject, scheduled_for, status
FROM scheduled_emails
WHERE status = 'pending'
AND scheduled_for <= NOW()
ORDER BY scheduled_for;
```

### Vérifier les logs d'envoi
```sql
SELECT * FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

## Configuration requise

### Variables d'environnement (déjà configurées)
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `RESEND_API_KEY`

### Configuration dans la base de données
Si le cron ne fonctionne pas, vous devez configurer :
```sql
SELECT set_app_config('supabase_url', 'https://your-project.supabase.co');
SELECT set_app_config('service_role_key', 'your-service-role-key');
```

## Fonctionnalités implémentées

1. **Planification d'emails**
   - Saisie de la date et heure en heure locale
   - Affichage du fuseau horaire actuel
   - Conversion automatique en UTC pour le stockage

2. **Affichage**
   - Toutes les dates sont affichées en heure locale
   - Le fuseau horaire est indiqué lors de la saisie/modification

3. **Envoi automatique**
   - Cron job qui s'exécute toutes les minutes
   - Traite tous les emails dont l'heure est passée
   - Gère les erreurs et envoie des notifications

4. **Notifications**
   - Notification de succès après l'envoi
   - Notification d'échec en cas d'erreur

## Dépannage

### Les emails ne sont pas envoyés
1. Vérifier que le cron job est actif (voir requête ci-dessus)
2. Vérifier les logs de la fonction edge dans Supabase Dashboard > Edge Functions > Logs
3. Vérifier que `RESEND_API_KEY` est configurée
4. Tester manuellement l'envoi avec curl

### L'heure affichée ne correspond pas
- Les heures sont stockées en UTC dans la base
- Les heures affichées sont converties en heure locale du navigateur
- Vérifier le fuseau horaire du système : `Intl.DateTimeFormat().resolvedOptions().timeZone`
