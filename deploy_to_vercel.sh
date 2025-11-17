#!/bin/bash

# Video Clipper Pro - Vercel Deployment Script
# This script prepares and deploys the frontend to Vercel

set -e  # Exit on any error

echo "🚀 Starting Video Clipper Pro Frontend Deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found"
    echo "Please install Vercel CLI first:"
    echo "npm install -g vercel"
    exit 1
fi

# Navigate to the project directory
cd /Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/video-clipper-pro

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit for Vercel deployment"
fi

echo "🧪 Testing build locally..."
# Test the build
npm run build

echo "🔍 Checking for environment variables..."
# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating a template..."
    cat > .env.local << 'ENVEND'
# Database & Auth
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# External Processing (for production)
EXTERNAL_PROCESSING_URL=https://your-vps-ip-or-domain
EXTERNAL_PROCESSING_API_KEY=your_api_key_here
ENVEND
    echo "📝 Created .env.local template. Please update with your actual values."
fi

echo "🌐 Deploying to Vercel..."
# Deploy to Vercel
if [ "$1" = "--prod" ]; then
    echo "📦 Deploying to production..."
    vercel --prod
else
    echo "🔧 Deploying to preview..."
    vercel
fi

echo "✅ Frontend deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update your environment variables in the Vercel dashboard"
echo "2. Add your custom domain in Vercel settings"
echo "3. Configure SSL certificates (automatically provided by Vercel)"
echo "4. Set up webhook endpoints for payment processing"
echo ""
echo "🔧 To deploy to production, run: ./deploy_to_vercel.sh --prod"