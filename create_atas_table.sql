-- Script para criação da tabela de Atas Escolares Oficiais com sequencial global
CREATE TABLE IF NOT EXISTS public.school_atas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  formatted_number TEXT NOT NULL,
  module_source TEXT NOT NULL, -- 'SECRETARIA', 'COORDENACAO', 'CIVICO_MILITAR', 'GESTAO'
  category TEXT NOT NULL,      -- 'DISCIPLINAR', 'PEDAGOGICO', 'PAIS_RESPONSAVEIS', 'CONSELHO_CLASSE', 'GESTAO_ALINHAMENTO', 'GERAL'
  pauta_assunto TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time_start TEXT NOT NULL,
  meeting_time_end TEXT NOT NULL,
  location TEXT NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  objectives TEXT NOT NULL,
  content_deliberations TEXT NOT NULL,
  forwarding_actions TEXT NOT NULL,
  signatory_name TEXT NOT NULL,
  signatory_role TEXT NOT NULL,
  signatories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e políticas de acesso livre
ALTER TABLE public.school_atas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select on school_atas" ON public.school_atas;
DROP POLICY IF EXISTS "Allow public insert on school_atas" ON public.school_atas;
DROP POLICY IF EXISTS "Allow public update on school_atas" ON public.school_atas;
DROP POLICY IF EXISTS "Allow public delete on school_atas" ON public.school_atas;

CREATE POLICY "Allow public select on school_atas" ON public.school_atas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on school_atas" ON public.school_atas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on school_atas" ON public.school_atas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on school_atas" ON public.school_atas FOR DELETE USING (true);
