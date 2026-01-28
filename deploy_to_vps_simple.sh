#!/bin/bash

# Simple VPS Deployment Script
# This script automates the deployment process to your VPS

VPS_IP="185.255.94.116"
VPS_USER="root"

echo "🚀 Starting Video Clipper VPS Deployment to $VPS_IP"

# Check if deployment package exists
if [ ! -f "/Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/version2_deploy.tar.gz" ]; then
    echo "❌ Deployment package not found!"
    echo "Please run the setup script first to create the package."
    exit 1
fi

echo "📦 Uploading deployment package..."
scp /Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/version2_deploy.tar.gz $VPS_USER@$VPS_IP:/root/

echo "🔧 Uploading setup scripts..."
scp /Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/version2/complete_vps_setup.sh $VPS_USER@$VPS_IP:/root/
scp /Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/version2/vps_python_setup.sh $VPS_USER@$VPS_IP:/root/
scp /Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/version2/setup_supervisor.sh $VPS_USER@$VPS_IP:/root/
scp /Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/version2/setup_nginx.sh $VPS_USER@$VPS_IP:/root/

echo "✅ Upload complete!"
echo ""
echo "📝 Next steps (run these commands on your VPS):"
echo "1. ssh $VPS_USER@$VPS_IP"
echo "2. chmod +x /root/*.sh"
echo "3. /root/complete_vps_setup.sh"
echo "4. (Follow the manual steps in the VPS_DEPLOYMENT_INSTRUCTIONS.md file)"
echo ""
echo "📄 For detailed instructions, check the VPS_DEPLOYMENT_INSTRUCTIONS.md file"