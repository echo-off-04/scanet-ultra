#!/bin/bash

# Script de test pour traiter les emails planifiés
# Usage: ./test-process-emails.sh

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Test de traitement des emails planifiés ===${NC}\n"

# Vérifier si les variables d'environnement existent
if [ -f .env ]; then
  source .env
fi

# Vérifier les variables requises
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo -e "${RED}Erreur: VITE_SUPABASE_URL n'est pas défini${NC}"
  exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}Erreur: VITE_SUPABASE_ANON_KEY n'est pas défini${NC}"
  exit 1
fi

echo -e "${YELLOW}URL Supabase:${NC} $VITE_SUPABASE_URL"
echo -e "${YELLOW}Appel de la fonction Edge...${NC}\n"

# Appeler la fonction Edge
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${VITE_SUPABASE_URL}/functions/v1/process-scheduled-emails" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  -d '{}')

# Séparer le corps de la réponse et le code HTTP
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

# Afficher les résultats
echo -e "${YELLOW}Code HTTP:${NC} $HTTP_CODE"
echo -e "${YELLOW}Réponse:${NC}"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"

# Vérifier le succès
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "\n${GREEN}✓ Traitement réussi${NC}"

  # Extraire les statistiques si disponibles
  PROCESSED=$(echo "$HTTP_BODY" | jq -r '.processed // 0' 2>/dev/null)
  SENT=$(echo "$HTTP_BODY" | jq -r '.sent // 0' 2>/dev/null)
  FAILED=$(echo "$HTTP_BODY" | jq -r '.failed // 0' 2>/dev/null)

  if [ "$PROCESSED" != "null" ] && [ "$PROCESSED" != "0" ]; then
    echo -e "${GREEN}  Emails traités: $PROCESSED${NC}"
    echo -e "${GREEN}  Emails envoyés: $SENT${NC}"
    [ "$FAILED" != "0" ] && echo -e "${RED}  Emails échoués: $FAILED${NC}"
  fi
else
  echo -e "\n${RED}✗ Erreur lors du traitement${NC}"
fi
