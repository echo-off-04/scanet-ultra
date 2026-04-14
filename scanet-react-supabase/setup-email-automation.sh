#!/bin/bash

# Setup Email Automation for ScaNetwork
# This script helps configure the email automation system

set -e

echo "======================================"
echo "  ScaNetwork Email Automation Setup  "
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create a .env file with your Supabase credentials first."
    exit 1
fi

# Load environment variables
source .env

echo -e "${YELLOW}Step 1: Checking environment variables...${NC}"

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}Error: VITE_SUPABASE_URL not found in .env${NC}"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_SERVICE_ROLE_KEY not found in .env${NC}"
    exit 1
fi

if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${YELLOW}Warning: RESEND_API_KEY not found in .env${NC}"
    echo "Email sending will not work without it."
    echo "Get your API key from: https://resend.com/api-keys"
    echo ""
fi

echo -e "${GREEN}✓ Environment variables found${NC}"
echo ""

echo -e "${YELLOW}Step 2: Configuring database...${NC}"

# Create SQL file for configuration
cat > /tmp/configure-email-automation.sql << EOF
-- Configure email automation system
SELECT set_app_config('supabase_url', '${VITE_SUPABASE_URL}');
SELECT set_app_config('service_role_key', '${SUPABASE_SERVICE_ROLE_KEY}');

-- Check status
SELECT * FROM check_cron_status();
EOF

echo "Configuration SQL created. Please run this in your Supabase SQL Editor:"
echo ""
echo "======================================"
cat /tmp/configure-email-automation.sql
echo "======================================"
echo ""

echo -e "${YELLOW}Step 3: Testing the system...${NC}"

# Test the edge function
echo "Testing email processing endpoint..."

response=$(curl -s -w "\n%{http_code}" -X POST \
    "${VITE_SUPABASE_URL}/functions/v1/process-scheduled-emails" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"triggered_by":"setup_script"}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Edge function is working${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Edge function failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi

echo ""
echo -e "${YELLOW}Step 4: Setup instructions${NC}"
echo ""
echo "1. Run the SQL commands above in Supabase SQL Editor"
echo "2. Verify the configuration:"
echo "   SELECT * FROM check_cron_status();"
echo ""
echo "3. (Optional) If pg_cron is not available, set up external webhook:"
echo "   - Visit: https://cron-job.org"
echo "   - Create new job:"
echo "     URL: ${VITE_SUPABASE_URL}/functions/v1/process-scheduled-emails"
echo "     Method: POST"
echo "     Header: Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
echo "     Schedule: * * * * * (every minute)"
echo ""
echo "4. Test by creating a scheduled email in the app for 2 minutes from now"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "For more information, see: GUIDE_AUTOMATISATION_EMAILS.md"
