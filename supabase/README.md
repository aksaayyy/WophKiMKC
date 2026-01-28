# Supabase Database Setup for Video Clipper Pro

This directory contains all the necessary files to set up and configure the Supabase database for Video Clipper Pro.

## 📁 File Structure

```
supabase/
├── README.md                 # This file
├── config.toml              # Supabase project configuration
├── .env.example             # Environment variables template
├── setup.sh                 # Automated setup script
├── init.sql                 # Complete database initialization
├── schema.sql               # Database schema only
├── rls_policies.sql         # Row Level Security policies
└── migrations/
    ├── 001_initial_schema.sql   # Initial schema migration
    └── 002_rls_policies.sql     # RLS policies migration
```

## 🚀 Quick Setup

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Install Docker (required for local development)

### Automated Setup

Run the setup script from the project root:

```bash
./supabase/setup.sh
```

This script will:
- Initialize the Supabase project
- Start local development environment
- Apply database schema and RLS policies
- Generate TypeScript types
- Display connection information

### Manual Setup

If you prefer manual setup:

1. **Initialize Supabase project:**
   ```bash
   supabase init
   ```

2. **Start local development:**
   ```bash
   supabase start
   ```

3. **Apply database schema:**
   ```bash
   supabase db reset
   ```

4. **Generate types:**
   ```bash
   supabase gen types typescript --local > types/supabase.ts
   ```

## 🗄️ Database Schema

### Core Tables

- **users**: Extended user profiles with subscription tiers
- **teams**: Team workspaces for collaboration
- **team_members**: Junction table for team membership
- **video_jobs**: Video processing job tracking
- **templates**: Saved processing configurations
- **usage_tracking**: Resource consumption monitoring

### Custom Types

- `subscription_tier`: 'free' | 'pro' | 'business'
- `job_status`: 'queued' | 'processing' | 'completed' | 'failed'
- `quality_preset`: 'social' | 'pro' | 'cinematic'
- `enhancement_level`: 'none' | 'basic' | 'pro' | 'cinematic'
- `platform_target`: 'tiktok' | 'instagram' | 'youtube_shorts'
- `team_role`: 'owner' | 'admin' | 'editor' | 'viewer'

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Team members can access shared team data based on their role
- Proper permission checks for all operations

### Helper Functions

- `is_team_member(user_uuid, team_uuid)`: Check team membership
- `get_team_role(user_uuid, team_uuid)`: Get user's role in team

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Authentication Providers

The configuration supports:
- Email/Password authentication
- Google OAuth (configure client ID/secret)
- GitHub OAuth (configure client ID/secret)

## 📊 Usage Limits by Tier

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Clips/month | 10 | 100 | 1,000 |
| Processing time | 60 min | 600 min | 6,000 min |
| Storage | 1 GB | 10 GB | 100 GB |
| Team members | 1 | 5 | 25 |

## 🛠️ Development Commands

```bash
# Start local development
supabase start

# Stop local development
supabase stop

# Reset database (applies all migrations)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts

# View logs
supabase logs

# Check status
supabase status
```

## 🔗 Local Development URLs

- **API URL**: http://localhost:54321
- **Database URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio URL**: http://localhost:54323
- **Inbucket (Email testing)**: http://localhost:54324

## 📝 Migration Management

### Creating New Migrations

```bash
supabase migration new migration_name
```

### Applying Migrations

```bash
supabase db reset  # Applies all migrations
```

## 🚀 Production Deployment

1. Create a Supabase project at https://supabase.com
2. Run the `init.sql` script in the SQL editor
3. Configure authentication providers
4. Update environment variables with production URLs
5. Set up proper backup and monitoring

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `config.toml` if needed
2. **Docker not running**: Ensure Docker is installed and running
3. **Permission errors**: Check RLS policies and user authentication
4. **Migration failures**: Check SQL syntax and dependencies

### Useful Commands

```bash
# Check Docker containers
docker ps

# View Supabase logs
supabase logs

# Reset everything
supabase stop
supabase start
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)