#!/bin/bash
# HookClip Start/Stop Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ports
WEB_PORT=4000
SERVER_PORT=3001
REDIS_PORT=6379

# Log files
SERVER_LOG="/tmp/hookclip-server.log"
WEB_LOG="/tmp/hookclip-web.log"

show_help() {
    echo -e "${BLUE}HookClip Manager${NC}"
    echo ""
    echo "Usage: ./start.sh [command]"
    echo ""
    echo "Server Commands:"
    echo "  start       - Start all services (Redis, Server, Web)"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  status      - Check service status"
    echo "  logs        - Show logs"
    echo "  dev         - Start in dev mode with logs visible"
    echo ""
    echo "Mobile Commands:"
    echo "  ios         - Start iOS simulator"
    echo "  build-ios   - Build iOS app"
    echo "  android     - Start on Android device (USB)"
    echo "  build-and   - Build Android APK"
    echo "  mobile-web  - Serve mobile web app for phone browser"
    echo ""
}

check_redis() {
    if redis-cli ping > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

start_redis() {
    if check_redis; then
        echo -e "${GREEN}✓${NC} Redis already running on port $REDIS_PORT"
    else
        echo -e "${YELLOW}→${NC} Starting Redis..."
        redis-server --daemonize yes
        sleep 1
        if check_redis; then
            echo -e "${GREEN}✓${NC} Redis started on port $REDIS_PORT"
        else
            echo -e "${RED}✗${NC} Failed to start Redis"
            exit 1
        fi
    fi
}

start_server() {
    if lsof -i :$SERVER_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Server already running on port $SERVER_PORT"
    else
        echo -e "${YELLOW}→${NC} Starting backend server..."
        cd server
        npm run dev > "$SERVER_LOG" 2>&1 &
        cd ..
        
        # Wait for server to be ready
        for i in {1..30}; do
            if curl -s http://localhost:$SERVER_PORT/api/health > /dev/null 2>&1; then
                echo -e "${GREEN}✓${NC} Server started on port $SERVER_PORT"
                return 0
            fi
            sleep 1
        done
        echo -e "${RED}✗${NC} Server failed to start (check $SERVER_LOG)"
        return 1
    fi
}

start_web() {
    if lsof -i :$WEB_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Web already running on port $WEB_PORT"
    else
        echo -e "${YELLOW}→${NC} Starting web frontend..."
        cd web
        npm run dev > "$WEB_LOG" 2>&1 &
        cd ..
        
        # Wait for web to be ready
        for i in {1..30}; do
            if curl -s http://localhost:$WEB_PORT > /dev/null 2>&1; then
                echo -e "${GREEN}✓${NC} Web started on port $WEB_PORT"
                return 0
            fi
            sleep 1
        done
        echo -e "${RED}✗${NC} Web failed to start (check $WEB_LOG)"
        return 1
    fi
}

stop_services() {
    echo -e "${YELLOW}→${NC} Stopping services..."
    
    # Stop web (Next.js)
    pkill -f "next-server.*$WEB_PORT" 2>/dev/null || true
    pkill -f "next dev --port $WEB_PORT" 2>/dev/null || true
    
    # Stop server (Node)
    pkill -f "nodemon.*server" 2>/dev/null || true
    pkill -f "node src/index.js" 2>/dev/null || true
    
    # Stop redis (optional - usually keep it running)
    # redis-cli shutdown 2>/dev/null || true
    
    sleep 2
    echo -e "${GREEN}✓${NC} Services stopped"
}

show_status() {
    echo -e "${BLUE}Service Status:${NC}"
    echo ""
    
    if check_redis; then
        echo -e "  ${GREEN}●${NC} Redis     : running (port $REDIS_PORT)"
    else
        echo -e "  ${RED}●${NC} Redis     : stopped"
    fi
    
    if lsof -i :$SERVER_PORT > /dev/null 2>&1; then
        echo -e "  ${GREEN}●${NC} Server    : running (port $SERVER_PORT)"
    else
        echo -e "  ${RED}●${NC} Server    : stopped"
    fi
    
    if lsof -i :$WEB_PORT > /dev/null 2>&1; then
        echo -e "  ${GREEN}●${NC} Web       : running (port $WEB_PORT)"
    else
        echo -e "  ${RED}●${NC} Web       : stopped"
    fi
    
    echo ""
    echo -e "URLs:"
    echo -e "  Web UI: ${BLUE}http://localhost:$WEB_PORT${NC}"
    echo -e "  API:    ${BLUE}http://localhost:$SERVER_PORT${NC}"
}

show_logs() {
    echo -e "${YELLOW}Showing logs (Ctrl+C to exit)...${NC}"
    echo ""
    tail -f "$SERVER_LOG" "$WEB_LOG" 2>/dev/null || echo "No logs found"
}

dev_mode() {
    start_redis
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  HookClip Dev Mode${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Web UI: ${BLUE}http://localhost:$WEB_PORT${NC}"
    echo -e "API:    ${BLUE}http://localhost:$SERVER_PORT${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
    
    # Start server in background
    cd server && npm run dev &
    SERVER_PID=$!
    
    # Start web in background  
    cd web && npm run dev &
    WEB_PID=$!
    
    # Wait for interrupt
    trap "kill $SERVER_PID $WEB_PID 2>/dev/null; exit" INT
    wait
}

case "${1:-start}" in
    start)
        echo -e "${BLUE}Starting HookClip...${NC}"
        echo ""
        start_redis
        start_server
        start_web
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  HookClip is running!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "🌐 Web UI: ${BLUE}http://localhost:$WEB_PORT${NC}"
        echo -e "🔌 API:    ${BLUE}http://localhost:$SERVER_PORT${NC}"
        echo ""
        echo -e "Run ${YELLOW}./start.sh stop${NC} to stop services"
        echo -e "Run ${YELLOW}./start.sh logs${NC} to view logs"
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        $0 start
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    dev)
        dev_mode
        ;;
    ios)
        echo -e "${YELLOW}Starting iOS mobile app...${NC}"
        cd mobile && npm run ios
        ;;
    build-ios)
        echo -e "${YELLOW}Building iOS app...${NC}"
        cd mobile && ./build-ios.sh
        ;;
    android)
        echo -e "${YELLOW}Starting Android app on USB device...${NC}"
        cd mobile && ./build-android.sh --dev
        ;;
    build-and|build-android)
        echo -e "${YELLOW}Building Android APK...${NC}"
        cd mobile && ./build-android.sh --full
        ;;
    mobile-web)
        ./mobile-serve.sh
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
