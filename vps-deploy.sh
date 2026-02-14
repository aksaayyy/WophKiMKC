#!/bin/bash
# HookClip VPS Deployment Script
# Usage: ./vps-deploy.sh [domain] [email]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN=${1:-""}
EMAIL=${2:-""}

show_logo() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║          HookClip VPS Deployment Script               ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo -e "${YELLOW}Warning: Running as root. Creating hookclip user...${NC}"
        useradd -m -s /bin/bash hookclip 2>/dev/null || true
        echo "Please run: su - hookclip"
        exit 1
    fi
}

install_docker() {
    echo -e "${YELLOW}Installing Docker...${NC}"
    
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✓ Docker already installed${NC}"
        return
    fi
    
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    
    echo -e "${GREEN}✓ Docker installed${NC}"
    echo -e "${YELLOW}Please logout and login again, then re-run this script${NC}"
    exit 0
}

install_docker_compose() {
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose already installed${NC}"
        return
    fi
    
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
}

setup_ssl() {
    if [ -z "$DOMAIN" ]; then
        echo -e "${YELLOW}No domain provided. Generating self-signed SSL...${NC}"
        
        # Generate self-signed certificate
        sudo mkdir -p nginx/ssl
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=HookClip/CN=localhost"
        
        echo -e "${YELLOW}⚠️  Using self-signed SSL. Browsers will show warnings.${NC}"
        echo -e "   For production, provide a domain: ./vps-deploy.sh yourdomain.com your@email.com"
        return
    fi
    
    echo -e "${YELLOW}Setting up Let's Encrypt SSL for $DOMAIN...${NC}"
    
    # Install certbot
    sudo apt-get update
    sudo apt-get install -y certbot
    
    # Create directories
    sudo mkdir -p data/certbot/www
    sudo mkdir -p nginx/ssl
    
    # Get certificate
    sudo certbot certonly --standalone \
        -d "$DOMAIN" \
        --agree-tos \
        -m "$EMAIL" \
        --non-interactive
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
    
    # Auto-renewal hook
    echo "#!/bin/bash
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /path/to/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /path/to/nginx/ssl/key.pem
docker-compose -f docker-compose.vps.yml restart nginx" | sudo tee /etc/letsencrypt/renewal-hooks/deploy/hookclip.sh
    sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/hookclip.sh
    
    echo -e "${GREEN}✓ SSL certificate installed for $DOMAIN${NC}"
}

setup_firewall() {
    echo -e "${YELLOW}Configuring firewall...${NC}"
    
    # Allow SSH, HTTP, HTTPS
    sudo ufw allow OpenSSH 2>/dev/null || true
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    
    echo -e "${GREEN}✓ Firewall configured${NC}"
}

create_env() {
    echo -e "${YELLOW}Creating environment configuration...${NC}"
    
    if [ ! -f "server/.env" ]; then
        cp server/.env.vps server/.env
        
        if [ -n "$DOMAIN" ]; then
            sed -i "s|FRONTEND_URL=https://your-domain.com|FRONTEND_URL=https://$DOMAIN|g" server/.env
        fi
        
        # Generate random admin password
        ADMIN_PASS=$(openssl rand -base64 12)
        sed -i "s|ADMIN_PASSWORD=change_this_password|ADMIN_PASSWORD=$ADMIN_PASS|g" server/.env
        
        echo -e "${GREEN}✓ Environment file created${NC}"
        echo -e "${YELLOW}Admin Password: $ADMIN_PASS${NC}"
        echo -e "${YELLOW}Please update other settings in server/.env${NC}"
    else
        echo -e "${GREEN}✓ Environment file already exists${NC}"
    fi
}

deploy() {
    echo -e "${YELLOW}Building and deploying HookClip...${NC}"
    
    # Create data directories
    mkdir -p data/downloads data/output data/logs data/certbot/www
    
    # Build and start
    docker-compose -f docker-compose.vps.yml down 2>/dev/null || true
    docker-compose -f docker-compose.vps.yml pull
    docker-compose -f docker-compose.vps.yml build --no-cache
    docker-compose -f docker-compose.vps.yml up -d
    
    # Wait for services
    echo -e "${YELLOW}Waiting for services to start...${NC}"
    sleep 15
    
    # Health check
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is running${NC}"
    else
        echo -e "${YELLOW}! Server may still be starting...${NC}"
    fi
}

show_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✅ HookClip Deployed Successfully!          ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ -n "$DOMAIN" ]; then
        echo -e "🌐 Web App:     ${BLUE}https://$DOMAIN${NC}"
        echo -e "🔌 API:         ${BLUE}https://$DOMAIN/api${NC}"
        echo -e "📱 Mobile Web:  ${BLUE}https://$DOMAIN/mobile.html${NC}"
    else
        IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
        echo -e "🌐 Web App:     ${BLUE}https://$IP${NC} (accept SSL warning)"
        echo -e "🔌 API:         ${BLUE}https://$IP/api${NC}"
        echo -e "📱 Mobile Web:  ${BLUE}https://$IP/mobile.html${NC}"
    fi
    
    echo ""
    echo -e "📊 Admin Panel: ${BLUE}/admin${NC}"
    echo -e "❤️  Health Check: ${BLUE}/api/health${NC}"
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  View logs:    docker-compose -f docker-compose.vps.yml logs -f"
    echo "  Stop:         docker-compose -f docker-compose.vps.yml down"
    echo "  Restart:      docker-compose -f docker-compose.vps.yml restart"
    echo "  Update:       docker-compose -f docker-compose.vps.yml pull && docker-compose -f docker-compose.vps.yml up -d"
    echo ""
}

update_mobile_config() {
    echo -e "${YELLOW}Updating mobile app configuration...${NC}"
    
    if [ -n "$DOMAIN" ]; then
        API_URL="https://$DOMAIN/api"
    else
        IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
        API_URL="https://$IP/api"
    fi
    
    # Update mobile web
    sed -i "s|window.API_BASE_URL || \\"window.API_BASE_URL = '$API_URL';|g" web/public/mobile.html
    
    # Update React Native env
    echo "API_BASE_URL=$API_URL" > mobile/.env.production
    
    echo -e "${GREEN}✓ Mobile apps configured to use: $API_URL${NC}"
    echo -e "${YELLOW}  Update mobile/.env.production with your VPS details${NC}"
}

# Main
clear
show_logo

echo "This script will deploy HookClip on your VPS"
echo ""

if [ -z "$DOMAIN" ]; then
    echo -e "${YELLOW}Usage: ./vps-deploy.sh your-domain.com your-email@example.com${NC}"
    echo "Or without SSL: ./vps-deploy.sh"
    echo ""
    read -p "Continue without domain? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

check_root
install_docker
install_docker_compose
setup_firewall
setup_ssl
create_env
deploy
update_mobile_config
show_summary

echo -e "${GREEN}Done! Your HookClip instance is ready for users.${NC}"
