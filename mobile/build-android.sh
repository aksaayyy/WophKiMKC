#!/bin/bash
# Build HookClip Android app for USB-connected device

set -e

echo "🚀 HookClip Android Builder"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ADB_CHECK=${1:-""}

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check .env configuration
    if [ -f ".env" ]; then
        API_URL=$(grep API_BASE_URL .env | cut -d'=' -f2)
        if [[ "$API_URL" == *"localhost"* ]]; then
            echo -e "${YELLOW}⚠️  Warning: Using localhost in .env${NC}"
            echo "   For USB devices, use your computer's IP address"
            echo "   Example: API_BASE_URL=http://192.168.1.xxx:3001/api"
            echo "   Or run: adb reverse tcp:3001 tcp:3001"
            echo ""
        fi
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Node.js: $(node --version)"
    
    if ! command -v adb &> /dev/null; then
        echo -e "${RED}❌ ADB not found${NC}"
        echo "Install Android Studio and add platform-tools to PATH"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} ADB installed"
    
    if ! command -v java &> /dev/null; then
        echo -e "${RED}❌ Java not found${NC}"
        echo "Install JDK 17 or higher"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Java installed"
}

# Check USB device
check_device() {
    echo ""
    echo -e "${YELLOW}Checking for Android device...${NC}"
    
    devices=$(adb devices | grep -v "List" | grep "device$")
    
    if [ -z "$devices" ]; then
        echo -e "${RED}❌ No Android device connected${NC}"
        echo ""
        echo "To enable USB debugging:"
        echo "1. Enable Developer Options (Settings > About > Tap Build Number 7 times)"
        echo "2. Enable USB Debugging (Settings > Developer Options)"
        echo "3. Connect device via USB and allow debugging"
        echo ""
        echo -e "${YELLOW}Checking wireless ADB...${NC}"
        
        # Check for wireless device
        wireless=$(adb devices | grep ":5555" || true)
        if [ -n "$wireless" ]; then
            echo -e "${GREEN}✓${NC} Wireless device found!"
            echo "$wireless"
        else
            exit 1
        fi
    else
        echo -e "${GREEN}✓${NC} Device connected via USB:"
        echo "$devices"
    fi
}

# List devices
list_devices() {
    echo ""
    echo -e "${BLUE}Connected devices:${NC}"
    adb devices -l
}

# Connect wirelessly
connect_wireless() {
    echo ""
    read -p "Enter device IP address: " ip
    if [ -n "$ip" ]; then
        echo -e "${YELLOW}Connecting to $ip:5555...${NC}"
        adb tcpip 5555
        adb connect $ip:5555
        echo -e "${GREEN}✓${NC} Connected! You can now unplug USB"
    fi
}

# Install dependencies
install_deps() {
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
}

# Prebuild Android
prebuild_android() {
    echo ""
    echo -e "${YELLOW}Prebuilding Android project...${NC}"
    npx expo prebuild --platform android --clean
}

# Build and install on device
build_install() {
    echo ""
    echo -e "${YELLOW}Building and installing APK...${NC}"
    
    # For development, use expo run android
    npx expo run:android --variant release
    
    echo ""
    echo -e "${GREEN}✅ App installed!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC} Run 'adb reverse tcp:3001 tcp:3001'"
    echo "   so the app can connect to the backend API."
}

# Quick install (skip build if already built)
quick_install() {
    echo ""
    echo -e "${YELLOW}Installing APK on device...${NC}"
    
    # Check if APK exists
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_PATH" ]; then
        adb install -r "$APK_PATH"
        echo -e "${GREEN}✓${NC} APK installed"
    else
        echo -e "${YELLOW}APK not found, building...${NC}"
        build_install
    fi
}

# Start Metro bundler
start_metro() {
    echo ""
    echo -e "${YELLOW}Starting Metro bundler...${NC}"
    npx expo start --android
}

# Reverse port for API (so device can access localhost:3001)
setup_port_forward() {
    echo ""
    echo -e "${YELLOW}Setting up port forwarding...${NC}"
    adb reverse tcp:3001 tcp:3001
    echo -e "${GREEN}✓${NC} Port 3001 forwarded (device → computer)"
    echo "   Device can now access http://localhost:3001/api"
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1) Full build & install (install → prebuild → build → install)"
    echo "2) Quick install (use existing APK)"
    echo "3) Start development server"
    echo "4) Setup port forwarding (for API access)"
    echo "5) List connected devices"
    echo "6) Connect wirelessly (after USB setup)"
    echo "7) Check device status"
    echo "8) Exit"
    echo ""
    read -p "Select option: " choice
    
    case $choice in
        1)
            check_prerequisites
            check_device
            install_deps
            prebuild_android
            build_install
            setup_port_forward
            ;;
        2)
            check_device
            quick_install
            ;;
        3)
            check_device
            start_metro
            ;;
        4)
            setup_port_forward
            ;;
        5)
            list_devices
            ;;
        6)
            connect_wireless
            ;;
        7)
            check_device
            ;;
        8)
            exit 0
            ;;
        *)
            echo "Invalid option"
            show_menu
            ;;
    esac
}

# Help
show_help() {
    echo "HookClip Android Builder"
    echo ""
    echo "Usage: ./build-android.sh [command]"
    echo ""
    echo "Commands:"
    echo "  (no args)   - Interactive menu"
    echo "  --full      - Full build and install"
    echo "  --install   - Install existing APK"
    echo "  --dev       - Start development server"
    echo "  --forward   - Setup port forwarding"
    echo "  --check     - Check device connection"
    echo "  --help      - Show this help"
    echo ""
    echo "Quick start:"
    echo "  1. Enable USB debugging on your Android device"
    echo "  2. Connect device via USB"
    echo "  3. Run: ./build-android.sh --full"
    echo ""
}

# Command line arguments
if [ $# -eq 0 ]; then
    show_menu
else
    case $1 in
        --full)
            check_prerequisites
            check_device
            install_deps
            prebuild_android
            build_install
            setup_port_forward
            ;;
        --install)
            check_device
            quick_install
            ;;
        --dev)
            check_device
            start_metro
            ;;
        --forward)
            setup_port_forward
            ;;
        --check)
            check_device
            ;;
        --help|-h)
            show_help
            ;;
        *)
            echo "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
fi
