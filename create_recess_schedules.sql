-- Create table for Recess Schedules
CREATE TABLE IF NOT EXISTS public.maintenance_recess_schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    start_date date NOT NULL,
    end_date date,
    recess_team integer CHECK (recess_team IN (1, 2)),
    working_days jsonb NOT NULL,
    activities text,
    daily_activities jsonb,
    t1_work_start date,
    t1_work_end date,
    t2_work_start date,
    t2_work_end date,
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

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_recess_schedules' AND column_name='t1_work_start') THEN
        ALTER TABLE public.maintenance_recess_schedules ADD COLUMN t1_work_start date;
        ALTER TABLE public.maintenance_recess_schedules ADD COLUMN t1_work_end date;
        ALTER TABLE public.maintenance_recess_schedules ADD COLUMN t2_work_start date;
        ALTER TABLE public.maintenance_recess_schedules ADD COLUMN t2_work_end date;
        ALTER TABLE public.maintenance_recess_schedules ALTER COLUMN recess_team DROP NOT NULL;
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
