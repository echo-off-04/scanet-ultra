#!/bin/bash

# Script de configuration automatique des emails planifiés
# Ce script lit les variables depuis .env et configure la base de données

set -e

echo "========================================="
echo "Configuration des Emails Automatiques"
echo "========================================="
echo ""

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Erreur : Le fichier .env n'existe pas"
    exit 1
fi

# Charger les variables depuis .env
export $(cat .env | grep -v '^#' | xargs)

# Vérifier que les variables nécessaires sont définies
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Erreur : VITE_SUPABASE_URL n'est pas défini dans .env"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Erreur : SUPABASE_SERVICE_ROLE_KEY n'est pas défini dans .env"
    exit 1
fi

echo "📋 Configuration détectée :"
echo "   URL Supabase : $VITE_SUPABASE_URL"
echo "   Service Key : ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
echo ""

# Créer le script SQL temporaire
SQL_FILE=$(mktemp)
cat > "$SQL_FILE" << EOF
-- Configuration automatique des emails planifiés
-- Généré le $(date)

-- Configurer l'URL Supabase
SELECT set_app_config('supabase_url', '$VITE_SUPABASE_URL');

-- Configurer la clé service role
SELECT set_app_config('service_role_key', '$SUPABASE_SERVICE_ROLE_KEY');

-- Vérifier la configuration
SELECT 'Configuration réussie' as status,
       key,
       CASE
         WHEN key = 'service_role_key' THEN LEFT(value, 20) || '...'
         ELSE value
       END as value,
       updated_at
FROM app_config
WHERE key IN ('supabase_url', 'service_role_key');

-- Vérifier le cron job
SELECT 'Cron job actif' as status,
       jobname,
       schedule,
       active
FROM cron.job
WHERE jobname = 'process-scheduled-emails';
EOF

echo "✅ Script SQL généré"
echo ""
echo "📝 Pour configurer la base de données, exécutez ce script SQL dans votre console Supabase :"
echo "   1. Allez sur https://supabase.com/dashboard"
echo "   2. Sélectionnez votre projet"
echo "   3. Allez dans SQL Editor"
echo "   4. Copiez et exécutez le contenu ci-dessous :"
echo ""
echo "----------------------------------------"
cat "$SQL_FILE"
echo "----------------------------------------"
echo ""

# Sauvegarder le script pour référence
cp "$SQL_FILE" setup-email-automation-generated.sql
echo "✅ Script sauvegardé dans : setup-email-automation-generated.sql"

# Nettoyer
rm "$SQL_FILE"

echo ""
echo "========================================="
echo "✅ Configuration préparée avec succès !"
echo "========================================="
echo ""
echo "Prochaines étapes :"
echo "1. Exécutez le script SQL ci-dessus dans votre console Supabase"
echo "2. Vérifiez que RESEND_API_KEY est configuré dans les secrets Supabase"
echo "3. Testez en créant un email planifié"
echo ""
