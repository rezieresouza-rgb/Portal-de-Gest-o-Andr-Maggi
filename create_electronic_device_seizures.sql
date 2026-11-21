-- ==============================================================================
-- TABELA: electronic_device_seizures
-- Controle de Recolhimento, Guarda Temporária e Devolução de Aparelhos Eletrônicos
-- Base Legal: Lei Federal nº 15.100/2025, Decreto Federal nº 12.385/2025,
--             Lei Estadual MT nº 12.745/2024, ECA (Lei 8.069/1990), LGPD e
--             Regulamento Disciplinar EECM-MT (Item 61).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.electronic_device_seizures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_number TEXT NOT NULL,
    occurrence_sequence INTEGER NOT NULL DEFAULT 1,
    school_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    module_source TEXT NOT NULL DEFAULT 'CIVICO_MILITAR',

    -- Identificação do Estudante
    student_id TEXT,
    student_code TEXT,
    student_name TEXT NOT NULL,
    classroom_name TEXT NOT NULL,
    shift TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    student_is_paed BOOLEAN DEFAULT false,
    paed_exception_verified BOOLEAN DEFAULT true,

    -- Dados do Recolhimento
    seizure_date DATE NOT NULL,
    seizure_time TEXT NOT NULL,
    seizure_location TEXT NOT NULL,
    seizure_subject_activity TEXT,
    seizure_reason TEXT NOT NULL,
    seized_by_name TEXT NOT NULL,
    seized_by_role TEXT,
    student_refused_signature BOOLEAN DEFAULT false,
    witness_name TEXT,

    -- Identificação e Condições Físicas do Aparelho (Vistoria)
    device_type TEXT NOT NULL,
    device_brand_model TEXT NOT NULL,
    device_color TEXT,
    device_imei_serial TEXT,
    seal_number TEXT,
    screen_condition TEXT NOT NULL DEFAULT 'INTEGRA',
    body_condition TEXT NOT NULL DEFAULT 'INTEGRA',
    power_state TEXT NOT NULL DEFAULT 'LIGADO_DESLIGADO_ALUNO',
    accessories JSONB NOT NULL DEFAULT '[]'::jsonb,
    preexisting_damage_notes TEXT,

    -- Política de Devolução e Controle de Custódia
    return_policy TEXT NOT NULL DEFAULT 'ALUNO_FIM_TURNO',
    status TEXT NOT NULL DEFAULT 'SOB_GUARDA',

    -- Dados da Devolução (Responsável Legal OU Próprio Estudante)
    returned_to_type TEXT,
    receiver_name TEXT,
    receiver_document TEXT,
    receiver_relationship TEXT,
    receiver_phone TEXT,
    returned_date DATE,
    returned_time TEXT,
    returned_by_name TEXT,
    return_condition_ok BOOLEAN DEFAULT true,
    return_notes TEXT,

    -- Auditoria
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_eds_status ON public.electronic_device_seizures (status);
CREATE INDEX IF NOT EXISTS idx_eds_student_code ON public.electronic_device_seizures (student_code);
CREATE INDEX IF NOT EXISTS idx_eds_student_name ON public.electronic_device_seizures (student_name);
CREATE INDEX IF NOT EXISTS idx_eds_seizure_date ON public.electronic_device_seizures (seizure_date DESC);
CREATE INDEX IF NOT EXISTS idx_eds_school_year ON public.electronic_device_seizures (school_year);
CREATE INDEX IF NOT EXISTS idx_eds_classroom ON public.electronic_device_seizures (classroom_name);

ALTER TABLE public.electronic_device_seizures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'electronic_device_seizures'
          AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users"
            ON public.electronic_device_seizures
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
