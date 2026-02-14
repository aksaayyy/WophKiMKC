#!/bin/bash
# Serve mobile web app for USB-connected devices

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PORT=4001

echo -e "${BLUE}HookClip Mobile Web Server${NC}"
echo ""

# Get IP address
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo -e "Computer IP: ${YELLOW}$IP${NC}"
echo ""

# Check if device is connected
echo -e "${YELLOW}Checking USB connection...${NC}"
if adb devices | grep -q "device$"; then
    echo -e "${GREEN}✓${NC} Android device connected via USB"
    
    # Forward port
    adb reverse tcp:3001 tcp:3001
    echo -e "${GREEN}✓${NC} Port 3001 forwarded (API)"
    adb reverse tcp:$PORT tcp:$PORT
    echo -e "${GREEN}✓${NC} Port $PORT forwarded (Web)"
else
    echo -e "${YELLOW}!${NC} No USB device detected"
    echo "  Make sure USB debugging is enabled"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Mobile Web App Ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📱 Open on your phone:"
echo -e "   ${BLUE}http://localhost:$PORT/mobile.html${NC}"
echo ""
echo -e "🔗 Or using IP (same WiFi):"
echo -e "   ${BLUE}http://$IP:$PORT/mobile.html${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Start simple HTTP server
cd web/public && python3 -m http.server $PORT
