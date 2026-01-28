#!/bin/bash

# Supabase Project Setup Script for Video Clipper Pro
# This script initializes the Supabase project and sets up the database schema

set -e

echo "🚀 Setting up Supabase project for Video Clipper Pro..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Initialize Supabase project if not already initialized
if [ ! -f "supabase/.gitignore" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
else
    echo "✅ Supabase project already initialized"
fi

# Start Supabase local development
echo "🔧 Starting Supabase local development environment..."
supabase start

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Apply database migrations
echo "📊 Applying database schema..."
if [ -f "supabase/migrations/001_initial_schema.sql" ]; then
    supabase db reset
    echo "✅ Database schema applied successfully"
else
    echo "⚠️  Migration files not found, applying init.sql directly..."
    supabase db reset --db-url "postgresql://postgres:postgres@localhost:54322/postgres" < supabase/init.sql
fi

# Generate TypeScript types
echo "🔧 Generating TypeScript types..."
supabase gen types typescript --local > types/supabase.ts

# Display connection information
echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "📋 Connection Information:"
echo "   API URL: http://localhost:54321"
echo "   DB URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo "   Studio URL: http://localhost:54323"
echo "   Inbucket URL: http://localhost:54324"
echo ""
echo "🔑 API Keys:"
supabase status | grep -E "(API URL|anon key|service_role key)"
echo ""
echo "📝 Next steps:"
echo "   1. Copy supabase/.env.example to .env and fill in your values"
echo "   2. Update your application configuration with the local URLs"
echo "   3. Test the database connection"
echo ""
echo "🛠️  To stop the local environment: supabase stop"
echo "🔄 To reset the database: supabase db reset"