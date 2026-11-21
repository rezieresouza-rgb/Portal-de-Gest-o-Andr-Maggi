-- =============================================================================
-- CONTROLE OPERACIONAL E PATRIMONIAL DE CHROMEBOOKS E FONES DE OUVIDO (EECM)
-- Baseado na planilha Controle_Chromebooks_Fones_EECM_2027_Atualizada.xlsx
-- Integrado à tabela oficial de inventário patrimonial `public.assets`
-- =============================================================================

-- 1. Cadastro dos Pares (Chromebook + Fone) por Estação e Posição
CREATE TABLE IF NOT EXISTS public.chromebook_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id TEXT NOT NULL,                  -- Ex: 'Estação 01' .. 'Estação 05'
    station_location TEXT,                     -- Ex: 'Biblioteca', 'Sala 22'
    position_number INTEGER NOT NULL,          -- Posição física no armário (1..20+)
    chromebook_number TEXT,                    -- Ex: '01' ou 'CB-01'
    headphone_number TEXT,                     -- Ex: '01' ou 'FN-01'
    heritage_number TEXT,                      -- Nº patrimônio / tombamento SEDUC
    serial_number TEXT,                        -- Nº de série (N/S)
    brand TEXT DEFAULT 'Positivo',
    model TEXT DEFAULT 'Chromebook',
    has_charger BOOLEAN DEFAULT true,
    chromebook_condition TEXT DEFAULT 'ÓTIMO', -- ÓTIMO | BOM | REGULAR | COM AVARIA | INOPERANTE | PÉSSIMO
    headphone_condition TEXT DEFAULT 'ÓTIMO',  -- ÓTIMO | BOM | REGULAR | COM AVARIA | AUSENTE | PÉSSIMO
    operational_status TEXT DEFAULT 'DISPONIVEL', -- DISPONIVEL | EM_USO | EM_MANUTENCAO | INSERVIVEL
    acquisition_year TEXT,
    acquisition_document TEXT,
    notes TEXT,
    linked_asset_id UUID,                      -- Referência ao bem correspondente em public.assets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cb_pairs_station ON public.chromebook_pairs (station_id, position_number);
CREATE INDEX IF NOT EXISTS idx_cb_pairs_heritage ON public.chromebook_pairs (heritage_number);

-- 2. Controle de Utilizações (Retirada e Devolução por estudante/aula)
CREATE TABLE IF NOT EXISTS public.chromebook_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    station_id TEXT NOT NULL,
    classroom_name TEXT NOT NULL,
    shift TEXT NOT NULL,                       -- MATUTINO | VESPERTINO | NOTURNO
    teacher_name TEXT NOT NULL,
    student_name TEXT NOT NULL,
    chromebook_number TEXT,
    headphone_number TEXT,
    checkout_time TEXT,
    return_time TEXT,
    situation TEXT DEFAULT 'EM USO',           -- EM USO | DEVOLVIDO
    has_irregularity BOOLEAN DEFAULT false,
    observations TEXT,
    student_leader_support TEXT,               -- Líder / vice-líder (apoio)
    checked_by_teacher BOOLEAN DEFAULT false,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cb_usages_date ON public.chromebook_usages (date DESC);
CREATE INDEX IF NOT EXISTS idx_cb_usages_station ON public.chromebook_usages (station_id);

-- 3. Conferência dos Vigias (Checklist de Guarda — Cinco Estações)
CREATE TABLE IF NOT EXISTS public.chromebook_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    station_id TEXT NOT NULL,
    guard_name TEXT NOT NULL,
    registered_chromebooks INTEGER DEFAULT 0,
    registered_headphones INTEGER DEFAULT 0,
    checked_chromebooks INTEGER DEFAULT 0,
    checked_headphones INTEGER DEFAULT 0,
    compartments_closed BOOLEAN DEFAULT true,
    visible_damage BOOLEAN DEFAULT false,
    observations TEXT,
    result TEXT DEFAULT 'REGULAR',             -- REGULAR | COM PENDÊNCIA | IRREGULAR
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cb_inspections_date ON public.chromebook_inspections (date DESC);

-- 4. Registro e Tratamento de Ocorrências / Irregularidades
CREATE TABLE IF NOT EXISTS public.chromebook_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    station_id TEXT NOT NULL,
    chromebook_number TEXT,
    headphone_number TEXT,
    occurrence_type TEXT NOT NULL,
    description TEXT NOT NULL,
    reported_to TEXT,
    responsible_person TEXT,
    deadline DATE,
    status TEXT DEFAULT 'PENDENTE',            -- PENDENTE | EM ANDAMENTO | CONCLUÍDA
    resolution TEXT,
    linked_pair_id UUID,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cb_occurrences_status ON public.chromebook_occurrences (status);
CREATE INDEX IF NOT EXISTS idx_cb_occurrences_date ON public.chromebook_occurrences (date DESC);

-- Habilitar RLS com acesso autenticado para todos os servidores do portal
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['chromebook_pairs', 'chromebook_usages', 'chromebook_inspections', 'chromebook_occurrences']
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = tbl
              AND policyname = 'Enable all access for authenticated users'
        ) THEN
            EXECUTE format(
                'CREATE POLICY "Enable all access for authenticated users" ON public.%I FOR ALL USING (true) WITH CHECK (true);',
                tbl
            );
        END IF;
    END LOOP;
END $$;
