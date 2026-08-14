-- SCRIPT DE CRIAÇÃO DAS TABELAS DE GESTÃO DE CHROMEBOOKS NO SUPABASE

-- 1. Tabela de Equipamentos Chromebooks
CREATE TABLE IF NOT EXISTS public.chromebook_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag TEXT UNIQUE NOT NULL,
    internal_number TEXT,
    serial_number TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL DEFAULT 'Positivo',
    model TEXT NOT NULL DEFAULT 'Chromebook C434',
    station_id TEXT NOT NULL DEFAULT 'Estação 01 (biblioteca)',
    status TEXT NOT NULL DEFAULT 'DISPONIVEL',
    condition TEXT NOT NULL DEFAULT 'OTIMO',
    has_charger BOOLEAN DEFAULT TRUE,
    notes TEXT,
    last_inspection_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Ocorrências e Manutenções
CREATE TABLE IF NOT EXISTS public.chromebook_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chromebook_id UUID REFERENCES public.chromebook_assets(id) ON DELETE CASCADE,
    asset_tag TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    defect_type TEXT NOT NULL,
    description TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'ABERTO',
    resolution_notes TEXT,
    completed_date DATE,
    cost NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Empréstimos / Checkouts
CREATE TABLE IF NOT EXISTS public.chromebook_checkouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    shift TEXT NOT NULL DEFAULT 'MATUTINO',
    checkout_date DATE DEFAULT CURRENT_DATE,
    checkout_time TIME DEFAULT CURRENT_TIME,
    expected_return_date DATE DEFAULT CURRENT_DATE,
    actual_return_date DATE,
    status TEXT NOT NULL DEFAULT 'ATIVO',
    quantity_checked_out INTEGER DEFAULT 0,
    chromebook_serial_numbers TEXT[] DEFAULT '{}',
    missing_chargers_count INTEGER DEFAULT 0,
    return_notes TEXT,
    checked_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
