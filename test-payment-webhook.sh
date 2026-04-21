#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                    ║${NC}"
echo -e "${BLUE}║        Payment Webhook Test Script                ║${NC}"
echo -e "${BLUE}║                                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Get payment ID from user
echo -e "${YELLOW}Enter Payment ID:${NC}"
echo -e "${YELLOW}(Example: pay_1772002048245)${NC}"
read -p "> " PAYMENT_ID

if [ -z "$PAYMENT_ID" ]; then
    echo -e "${RED}❌ Error: Payment ID required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Triggering webhook for payment: ${PAYMENT_ID}${NC}"
echo ""

# Generate random transaction hash
TX_HASH="0x$(openssl rand -hex 32)"

# Trigger webhook
RESPONSE=$(curl -s -X POST http://localhost:8080/plaid/webhook/payment \
  -H "Content-Type: application/json" \
  -d "{
    \"paymentId\": \"$PAYMENT_ID\",
    \"status\": \"completed\",
    \"transactionHash\": \"$TX_HASH\"
  }")

# Pretty print response
echo -e "${BLUE}Response:${NC}"
echo "$RESPONSE" | python3 -m json.tool

# Check if successful
if echo "$RESPONSE" | grep -q '"success": true'; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                    ║${NC}"
    echo -e "${GREEN}║  ✅ Webhook Triggered Successfully!               ║${NC}"
    echo -e "${GREEN}║                                                    ║${NC}"
    echo -e "${GREEN}║  Check frontend - status should update            ║${NC}"
    echo -e "${GREEN}║  within 5 seconds!                                ║${NC}"
    echo -e "${GREEN}║                                                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Payment ID:${NC} $PAYMENT_ID"
    echo -e "${BLUE}Status:${NC} completed"
    echo -e "${BLUE}Transaction Hash:${NC} $TX_HASH"
else
    echo ""
    echo -e "${RED}❌ Webhook failed!${NC}"
    echo -e "${RED}Check if payment ID is correct${NC}"
fi

echo ""
