#!/bin/bash
# Build HookClip Mobile Apps for Distribution

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VPS_DOMAIN=${1:-""}

show_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║        HookClip Mobile App Build & Distribution          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} Node.js: $(node --version)"
}

configure_api() {
    if [ -z "$VPS_DOMAIN" ]; then
        echo ""
        echo -e "${YELLOW}Enter your VPS domain or IP:${NC}"
        read -p "> " VPS_DOMAIN
    fi
    
    API_URL="https://$VPS_DOMAIN/api"
    
    echo -e "${YELLOW}Configuring mobile apps...${NC}"
    echo -e "API URL: ${BLUE}$API_URL${NC}"
    
    # Update mobile web
    sed -i.bak "s|window.API_BASE_URL = '.*'|window.API_BASE_URL = '$API_URL'|g" web/public/mobile.html 2>/dev/null || true
    echo "API_BASE_URL='$API_URL';" | cat - web/public/mobile.html > temp && mv temp web/public/mobile.html
    
    # Update React Native
    echo "API_BASE_URL=$API_URL" > mobile/.env.production
    
    echo -e "${GREEN}✓ Mobile apps configured${NC}"
}

build_android() {
    echo ""
    echo -e "${YELLOW}Building Android APK...${NC}"
    
    cd mobile
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Prebuild
    npx expo prebuild --platform android
    
    # Build release APK
    cd android
    ./gradlew assembleRelease
    
    cd ../..
    
    APK_PATH="mobile/android/app/build/outputs/apk/release/app-release.apk"
    
    if [ -f "$APK_PATH" ]; then
        echo -e "${GREEN}✓ Android APK built${NC}"
        
        # Copy to web for download
        mkdir -p web/public/downloads
        cp "$APK_PATH" web/public/downloads/hookclip-android.apk
        
        echo -e "${GREEN}✓ APK copied to web/public/downloads/${NC}"
        echo -e "Download URL: ${BLUE}https://$VPS_DOMAIN/downloads/hookclip-android.apk${NC}"
    else
        echo -e "${RED}✗ APK build failed${NC}"
        exit 1
    fi
}

build_ios() {
    echo ""
    echo -e "${YELLOW}iOS Build Instructions:${NC}"
    echo ""
    echo "1. Open mobile/ios/HookClip.xcworkspace in Xcode"
    echo "2. Select your Apple ID in Signing & Capabilities"
    echo "3. Select 'Any iOS Device' as target"
    echo "4. Go to Product → Archive"
    echo "5. In Organizer, click 'Distribute App'"
    echo ""
    echo -e "${YELLOW}Or use Expo Build (requires Expo account):${NC}"
    echo "  cd mobile && eas build --platform ios"
    echo ""
}

build_web() {
    echo ""
    echo -e "${YELLOW}Building web app...${NC}"
    
    cd web
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Build
    npm run build
    
    cd ..
    
    echo -e "${GREEN}✓ Web app built${NC}"
}

create_landing_page() {
    echo -e "${YELLOW}Creating app download page...${NC}"
    
    cat > web/public/download.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download HookClip App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            text-align: center;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: #ef4444;
            border-radius: 20px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logo svg {
            width: 40px;
            height: 40px;
            fill: white;
        }
        h1 {
            font-size: 32px;
            margin-bottom: 8px;
        }
        p {
            color: #888;
            margin-bottom: 40px;
        }
        .download-options {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .download-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 16px 24px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            color: #fff;
            text-decoration: none;
            transition: all 0.2s;
        }
        .download-btn:hover {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
        }
        .download-btn.primary {
            background: #ef4444;
            border-color: #ef4444;
        }
        .download-btn.primary:hover {
            background: #dc2626;
        }
        .download-btn svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }
        .qr-section {
            margin-top: 40px;
            padding-top: 40px;
            border-top: 1px solid #333;
        }
        .qr-code {
            width: 200px;
            height: 200px;
            background: #fff;
            border-radius: 12px;
            margin: 16px auto;
            padding: 10px;
        }
        .web-link {
            margin-top: 32px;
            color: #666;
        }
        .web-link a {
            color: #ef4444;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <svg viewBox="0 0 24 24"><path d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.65.513-.938t1.012.038l8.15 5.175q.45.3.45.9t-.45.9l-8.15 5.175Z"/></svg>
        </div>
        <h1>Get HookClip</h1>
        <p>Download the app or use the web version</p>
        
        <div class="download-options">
            <a href="/mobile.html" class="download-btn primary">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                <div>
                    <strong>Web App</strong>
                    <small style="display: block; color: #888;">No download required</small>
                </div>
            </a>
            
            <a href="/downloads/hookclip-android.apk" class="download-btn">
                <svg viewBox="0 0 24 24"><path d="M17.523 15.3414c-.5 0-.909.409-.909.909 0 .5.409.909.909.909.5 0 .909-.409.909-.909 0-.5-.409-.909-.909-.909zm-11.046 0c-.5 0-.909.409-.909.909 0 .5.409.909.909.909.5 0 .909-.409.909-.909 0-.5-.409-.909-.909-.909zm11.4-6.117l1.995-3.455c.111-.192.045-.438-.147-.549-.192-.111-.438-.045-.549.147L17.153 8.87c-1.514-.691-3.211-1.081-5.153-1.081s-3.639.39-5.153 1.081L4.825 5.367c-.111-.192-.357-.258-.549-.147-.192.111-.258.357-.147.549l1.995 3.455C2.659 11.167.5 14.289.5 17.954h23c0-3.665-2.159-6.787-5.623-8.73z"/></svg>
                <div>
                    <strong>Android APK</strong>
                    <small style="display: block; color: #888;">Download & install</small>
                </div>
            </a>
            
            <div class="download-btn" style="opacity: 0.5;">
                <svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.21-1.96 1.08-3.11-1.05.05-2.31.71-3.06 1.55-.67.75-1.26 1.96-1.1 3.1 1.17.09 2.36-.74 3.08-1.54z"/></svg>
                <div>
                    <strong>iOS App</strong>
                    <small style="display: block; color: #888;">Coming soon to App Store</small>
                </div>
            </div>
        </div>
        
        <div class="web-link">
            Or open in your browser: <a href="/">hookclip.app</a>
        </div>
    </div>
</body>
</html>
EOF

    echo -e "${GREEN}✓ Download page created${NC}"
}

show_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✅ Build Complete!                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "📱 Mobile Apps:"
    echo -e "   • Web App:     ${BLUE}https://$VPS_DOMAIN/mobile.html${NC}"
    echo -e "   • Download:    ${BLUE}https://$VPS_DOMAIN/download.html${NC}"
    echo -e "   • Android APK: ${BLUE}https://$VPS_DOMAIN/downloads/hookclip-android.apk${NC}"
    echo ""
    echo -e "🚀 To deploy to VPS:"
    echo -e "   ./vps-deploy.sh $VPS_DOMAIN"
    echo ""
}

# Main
show_header
check_prerequisites

if [ $# -eq 0 ]; then
    echo ""
    echo "Usage: ./build-mobile-apps.sh your-domain.com"
    echo ""
fi

configure_api

# Menu
echo ""
echo "What would you like to build?"
echo "1) All (Web + Android APK)"
echo "2) Android APK only"
echo "3) iOS instructions"
echo "4) Web only"
echo "5) Exit"
echo ""
read -p "Choice: " choice

case $choice in
    1)
        build_web
        build_android
        create_landing_page
        show_summary
        ;;
    2)
        build_android
        ;;
    3)
        build_ios
        ;;
    4)
        build_web
        ;;
    5)
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
