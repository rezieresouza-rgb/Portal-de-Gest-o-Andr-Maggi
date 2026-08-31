-- Script para criação da tabela de Ofícios Escolares com sequencial global e assinaturas eletrônicas
CREATE TABLE IF NOT EXISTS public.school_oficios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  formatted_number TEXT NOT NULL,
  module_source TEXT NOT NULL, -- 'SECRETARIA', 'COORDENACAO', 'CIVICO_MILITAR'
  title_subject TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_role TEXT,
  recipient_org TEXT,
  city_date TEXT NOT NULL,
  salutation TEXT DEFAULT 'Prezado(a) Senhor(a),',
  body_text TEXT NOT NULL,
  closure_text TEXT DEFAULT 'Atenciosamente,',
  signatory_name TEXT NOT NULL,
  signatory_role TEXT NOT NULL,
  signatures JSONB DEFAULT '[]'::jsonb,
  is_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e políticas de acesso livre
ALTER TABLE public.school_oficios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select on school_oficios" ON public.school_oficios;
DROP POLICY IF EXISTS "Allow public insert on school_oficios" ON public.school_oficios;
DROP POLICY IF EXISTS "Allow public update on school_oficios" ON public.school_oficios;
DROP POLICY IF EXISTS "Allow public delete on school_oficios" ON public.school_oficios;

CREATE POLICY "Allow public select on school_oficios" ON public.school_oficios FOR SELECT USING (true);
CREATE POLICY "Allow public insert on school_oficios" ON public.school_oficios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on school_oficios" ON public.school_oficios FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on school_oficios" ON public.school_oficios FOR DELETE USING (true);
