#!/bin/bash
# HookClip Production Deploy Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════╗"
echo "║      HookClip Production Deploy      ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo -e "${RED}Error: server/.env not found!${NC}"
    echo "Please create it from .env.example:"
    echo "  cp server/.env.example server/.env"
    exit 1
fi

# Function to deploy with Docker
deploy_docker() {
    echo -e "${YELLOW}Deploying with Docker Compose...${NC}"
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Build and start
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for services
    echo -e "${YELLOW}Waiting for services to start...${NC}"
    sleep 10
    
    # Check health
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✓ Server is running${NC}"
    else
        echo -e "${RED}✗ Server failed to start${NC}"
        docker-compose -f docker-compose.prod.yml logs server
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  HookClip Deployed Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Web:    ${BLUE}http://localhost:3000${NC}"
    echo -e "API:    ${BLUE}http://localhost:3001${NC}"
    echo -e "Health: ${BLUE}http://localhost:3001/api/health${NC}"
    echo ""
    echo -e "Logs: ${YELLOW}docker-compose -f docker-compose.prod.yml logs -f${NC}"
}

# Function to deploy to Render
deploy_render() {
    echo -e "${YELLOW}Preparing for Render deployment...${NC}"
    
    # Check for render.yaml
    if [ ! -f "render.yaml" ]; then
        echo -e "${RED}render.yaml not found!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Push to GitHub and connect to Render dashboard:${NC}"
    echo -e "  ${BLUE}https://dashboard.render.com${NC}"
    echo ""
    echo "Or use Render CLI:"
    echo "  render deploy"
}

# Function to show deploy menu
show_menu() {
    echo ""
    echo "Select deployment method:"
    echo "1) Docker Compose (Self-hosted)"
    echo "2) Render.com"
    echo "3) Railway"
    echo "4) Show deploy documentation"
    echo "5) Exit"
    echo ""
    read -p "Choice: " choice
    
    case $choice in
        1) deploy_docker ;;
        2) deploy_render ;;
        3) echo "See DEPLOY.md for Railway instructions" ;;
        4) cat DEPLOY.md ;;
        5) exit 0 ;;
        *) echo "Invalid choice"; show_menu ;;
    esac
}

# Check command line args
if [ $# -eq 0 ]; then
    show_menu
else
    case $1 in
        docker)
            deploy_docker
            ;;
        render)
            deploy_render
            ;;
        update)
            echo -e "${YELLOW}Updating deployment...${NC}"
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            echo -e "${GREEN}✓ Updated!${NC}"
            ;;
        logs)
            docker-compose -f docker-compose.prod.yml logs -f
            ;;
        stop)
            docker-compose -f docker-compose.prod.yml down
            echo -e "${GREEN}✓ Stopped${NC}"
            ;;
        status)
            docker-compose -f docker-compose.prod.yml ps
            ;;
        *)
            echo "Usage: $0 [docker|render|update|logs|stop|status]"
            exit 1
            ;;
    esac
fi
