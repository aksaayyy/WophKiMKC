-- Row Level Security (RLS) Policies Migration
-- This migration sets up all RLS policies for data protection

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