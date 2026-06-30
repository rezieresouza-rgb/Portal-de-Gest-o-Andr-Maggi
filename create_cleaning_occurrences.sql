-- Script para criação da tabela de ocorrências de limpeza no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

CREATE TABLE IF NOT EXISTS public.cleaning_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'RESOLVIDO')),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.cleaning_occurrences ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso simplificadas (Sem restrição de autenticação para fins de compatibilidade com o portal)
CREATE POLICY "Permitir leitura pública" ON public.cleaning_occurrences
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública" ON public.cleaning_occurrences
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública" ON public.cleaning_occurrences
    FOR UPDATE USING (true);

CREATE POLICY "Permitir deleção pública" ON public.cleaning_occurrences
    FOR DELETE USING (true);
