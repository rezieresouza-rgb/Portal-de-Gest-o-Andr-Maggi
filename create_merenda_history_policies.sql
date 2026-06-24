-- Script para criar a tabela e configurar as políticas de RLS (Row Level Security) para o histórico do estoque da merenda escolar.
-- Execute este script no editor SQL do seu painel do Supabase.

-- 1. Criação da tabela (caso ainda não exista ou precise ser validada)
CREATE TABLE IF NOT EXISTS public.merenda_inventory_history (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    turno TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    items JSONB NOT NULL,
    timestamp BIGINT NOT NULL
);

-- 2. Habilitação do Row Level Security (RLS)
ALTER TABLE public.merenda_inventory_history ENABLE ROW LEVEL SECURITY;

-- 3. Remoção de políticas antigas, se houver
DROP POLICY IF EXISTS "Enable read access for all users" ON public.merenda_inventory_history;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.merenda_inventory_history;
DROP POLICY IF EXISTS "Enable update for all users" ON public.merenda_inventory_history;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.merenda_inventory_history;

-- 4. Criação das novas políticas para permitir leitura, inserção, atualização e exclusão pelos usuários
CREATE POLICY "Enable read access for all users"
    ON public.merenda_inventory_history FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all users"
    ON public.merenda_inventory_history FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for all users"
    ON public.merenda_inventory_history FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
    ON public.merenda_inventory_history FOR DELETE
    USING (true);
