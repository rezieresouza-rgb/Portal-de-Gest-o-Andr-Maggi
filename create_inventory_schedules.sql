-- SQL Migration to create asset_inventory_schedules table
-- Run this in your Supabase SQL Editor to support the inventory schedule module

CREATE TABLE IF NOT EXISTS asset_inventory_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANEJAMENTO',
    commission_members JSONB DEFAULT '{
      "president": {"name": "", "role": "", "register": ""},
      "secretary": {"name": "", "role": "", "register": ""},
      "member": {"name": "", "role": "", "register": ""}
    }'::jsonb,
    phases JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) if your project uses it.
ALTER TABLE asset_inventory_schedules ENABLE ROW LEVEL SECURITY;

-- Allow all actions for public or authenticated users depending on app structure
-- For convenience, we create a policy that allows all operations:
CREATE POLICY "Allow all operations on asset_inventory_schedules" 
ON asset_inventory_schedules
FOR ALL 
USING (true)
WITH CHECK (true);
