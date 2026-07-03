-- Create table for Recess Schedules
CREATE TABLE IF NOT EXISTS public.maintenance_recess_schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    start_date date NOT NULL,
    end_date date,
    team_1_members jsonb NOT NULL,
    team_2_members jsonb NOT NULL,
    recess_team integer NOT NULL CHECK (recess_team IN (1, 2)),
    working_days jsonb NOT NULL,
    activities text,
    daily_activities jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add activities, end_date and daily_activities column if the table was already created before
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_recess_schedules' AND column_name='activities') THEN
        ALTER TABLE public.maintenance_recess_schedules ADD COLUMN activities text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_recess_schedules' AND column_name='end_date') THEN
        ALTER TABLE public.maintenance_recess_schedules ADD COLUMN end_date date;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_recess_schedules' AND column_name='daily_activities') THEN
        ALTER TABLE public.maintenance_recess_schedules ADD COLUMN daily_activities jsonb;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.maintenance_recess_schedules ENABLE ROW LEVEL SECURITY;

-- Allow all actions for anon users (since supabaseClient uses VITE_SUPABASE_ANON_KEY)
CREATE POLICY "Allow all actions for anon on recess" ON public.maintenance_recess_schedules
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
    
-- Allow authenticated as well
CREATE POLICY "Allow all actions for auth on recess" ON public.maintenance_recess_schedules
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
