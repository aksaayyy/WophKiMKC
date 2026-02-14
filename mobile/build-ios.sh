#!/bin/bash
# Build HookClip iOS app

set -e

echo "🚀 HookClip iOS Builder"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Node.js: $(node --version)"
    
    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}❌ Xcode not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Xcode installed"
    
    if ! command -v pod &> /dev/null; then
        echo -e "${RED}❌ CocoaPods not found${NC}"
        echo "Install with: sudo gem install cocoapods"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} CocoaPods installed"
}

# Install dependencies
install_deps() {
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
}

# Prebuild iOS
prebuild_ios() {
    echo ""
    echo -e "${YELLOW}Prebuilding iOS project...${NC}"
    npx expo prebuild --platform ios --clean
}

# Install pods
install_pods() {
    echo ""
    echo -e "${YELLOW}Installing CocoaPods...${NC}"
    cd ios
    pod install --repo-update
    cd ..
}

# Build iOS
build_ios() {
    echo ""
    echo -e "${YELLOW}Building iOS app...${NC}"
    
    # Build for simulator
    xcodebuild \
        -workspace ios/HookClipMobile.xcworkspace \
        -scheme HookClipMobile \
        -configuration Release \
        -sdk iphonesimulator \
        -derivedDataPath ios/build \
        clean build
    
    echo ""
    echo -e "${GREEN}✅ Build complete!${NC}"
    echo ""
    echo -e "App location: ${BLUE}ios/build/Build/Products/Release-iphonesimulator/${NC}"
}

# Run in simulator
run_simulator() {
    echo ""
    echo -e "${YELLOW}Starting iOS Simulator...${NC}"
    npx expo run:ios
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1) Full build (install → prebuild → pods → build)"
    echo "2) Quick build (just build)"
    echo "3) Run in simulator"
    echo "4) Exit"
    echo ""
    read -p "Select option: " choice
    
    case $choice in
        1)
            check_prerequisites
            install_deps
            prebuild_ios
            install_pods
            build_ios
            ;;
        2)
            build_ios
            ;;
        3)
            run_simulator
            ;;
        4)
            exit 0
            ;;
        *)
            echo "Invalid option"
            show_menu
            ;;
    esac
}

# If no arguments, show menu
if [ $# -eq 0 ]; then
    show_menu
else
    case $1 in
        --full)
            check_prerequisites
            install_deps
            prebuild_ios
            install_pods
            build_ios
            ;;
        --build)
            build_ios
            ;;
        --run)
            run_simulator
            ;;
        *)
            echo "Usage: $0 [--full|--build|--run]"
            exit 1
            ;;
    esac
fi
