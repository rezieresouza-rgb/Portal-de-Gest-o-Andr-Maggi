-- Criação das tabelas do Módulo Cívico-Militar

CREATE TABLE IF NOT EXISTS public.civic_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    class_name TEXT,
    item TEXT NOT NULL,
    date DATE NOT NULL,
    shift TEXT,
    observations TEXT,
    responsible TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.civic_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    shift TEXT,
    formation_ok BOOLEAN,
    commanders_present BOOLEAN,
    flags_raised JSONB,
    anthems_sung JSONB,
    marching_ok BOOLEAN,
    bulletin_read BOOLEAN,
    responsible TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.civic_student_behavior (
    student_id TEXT PRIMARY KEY,
    student_name TEXT NOT NULL,
    class_name TEXT,
    score NUMERIC DEFAULT 8.0,
    is_class_leader BOOLEAN DEFAULT FALSE,
    is_civic_highlight BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.civic_occurrences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL REFERENCES public.civic_student_behavior(student_id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'MERIT' or 'DEMERIT'
    category TEXT,
    categories JSONB,
    points NUMERIC NOT NULL,
    date DATE NOT NULL,
    observations TEXT,
    responsible TEXT NOT NULL,
    disciplinary_measure TEXT,
    suspension_days INTEGER,
    is_escalated BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.civic_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template TEXT NOT NULL,
    date DATE NOT NULL,
    timestamp BIGINT NOT NULL,
    student_name TEXT,
    student_class TEXT,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.civic_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_student_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON public.civic_inspections FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.civic_routines FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.civic_student_behavior FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.civic_occurrences FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.civic_documents FOR ALL USING (true);
