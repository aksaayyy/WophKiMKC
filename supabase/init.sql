-- Supabase Project Initialization Script
-- This script sets up the complete database schema and policies for Video Clipper Pro

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'business');
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed');
CREATE TYPE quality_preset AS ENUM ('social', 'pro', 'cinematic');
CREATE TYPE enhancement_level AS ENUM ('none', 'basic', 'pro', 'cinematic');
CREATE TYPE platform_target AS ENUM ('tiktok', 'instagram', 'youtube_shorts');
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    subscription_tier subscription_tier DEFAULT 'free',
    team_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    member_limit INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members junction table
CREATE TABLE public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role team_role DEFAULT 'editor',
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Video jobs table
CREATE TABLE public.video_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    original_filename TEXT NOT NULL,
    original_filesize BIGINT NOT NULL,
    status job_status DEFAULT 'queued',
    clip_count INTEGER DEFAULT 5,
    quality_preset quality_preset DEFAULT 'social',
    enhancement_level enhancement_level DEFAULT 'none',
    platform_target platform_target,
    output_files TEXT[], -- Array of file paths
    processing_time INTEGER, -- Processing time in seconds
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Processing templates table
CREATE TABLE public.templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    settings JSONB NOT NULL, -- Processing configuration as JSON
    is_shared BOOLEAN DEFAULT FALSE,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE public.usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    clips_processed INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0, -- Total processing time in seconds
    storage_used BIGINT DEFAULT 0, -- Storage used in bytes
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, team_id, period_month, period_year)
);

-- Add foreign key constraint for users.team_id after teams table is created
ALTER TABLE public.users ADD CONSTRAINT fk_users_team_id 
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_video_jobs_user_id ON public.video_jobs(user_id);
CREATE INDEX idx_video_jobs_team_id ON public.video_jobs(team_id);
CREATE INDEX idx_video_jobs_status ON public.video_jobs(status);
CREATE INDEX idx_video_jobs_created_at ON public.video_jobs(created_at DESC);
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_team_id ON public.templates(team_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON public.usage_tracking(period_year, period_month);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is team member
CREATE OR REPLACE FUNCTION is_team_member(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE user_id = user_uuid AND team_id = team_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check team role
CREATE OR REPLACE FUNCTION get_team_role(user_uuid UUID, team_uuid UUID)
RETURNS team_role AS $$
BEGIN
    RETURN (
        SELECT role FROM public.team_members 
        WHERE user_id = user_uuid AND team_id = team_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams table policies
CREATE POLICY "Team members can view their teams" ON public.teams
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        is_team_member(auth.uid(), id)
    );

CREATE POLICY "Team owners can update their teams" ON public.teams
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams" ON public.teams
    FOR DELETE USING (owner_id = auth.uid());

-- Team members table policies
CREATE POLICY "Team members can view team membership" ON public.team_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_id AND t.owner_id = auth.uid()
        ) OR
        is_team_member(auth.uid(), team_id)
    );

CREATE POLICY "Team owners and admins can manage members" ON public.team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_id AND t.owner_id = auth.uid()
        ) OR
        get_team_role(auth.uid(), team_id) IN ('admin')
    );

CREATE POLICY "Users can join teams when invited" ON public.team_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Video jobs table policies
CREATE POLICY "Users can view their own jobs" ON public.video_jobs
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id))
    );

CREATE POLICY "Users can create their own jobs" ON public.video_jobs
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        (team_id IS NULL OR is_team_member(auth.uid(), team_id))
    );

CREATE POLICY "Users can update their own jobs" ON public.video_jobs
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id))
    );

CREATE POLICY "Users can delete their own jobs" ON public.video_jobs
    FOR DELETE USING (
        user_id = auth.uid() OR 
        (team_id IS NOT NULL AND get_team_role(auth.uid(), team_id) IN ('owner', 'admin'))
    );

-- Templates table policies
CREATE POLICY "Users can view their templates and shared team templates" ON public.templates
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id) AND is_shared = true)
    );

CREATE POLICY "Users can create their own templates" ON public.templates
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        (team_id IS NULL OR is_team_member(auth.uid(), team_id))
    );

CREATE POLICY "Users can update their own templates" ON public.templates
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        (team_id IS NOT NULL AND get_team_role(auth.uid(), team_id) IN ('owner', 'admin', 'editor'))
    );

CREATE POLICY "Users can delete their own templates" ON public.templates
    FOR DELETE USING (
        user_id = auth.uid() OR 
        (team_id IS NOT NULL AND get_team_role(auth.uid(), team_id) IN ('owner', 'admin'))
    );

-- Usage tracking table policies
CREATE POLICY "Users can view their own usage" ON public.usage_tracking
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id))
    );

CREATE POLICY "System can insert usage tracking" ON public.usage_tracking
    FOR INSERT WITH CHECK (true); -- Allow system inserts

CREATE POLICY "System can update usage tracking" ON public.usage_tracking
    FOR UPDATE USING (true); -- Allow system updates

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role for system operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
-- Addit
ional utility functions
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.templates 
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;