CREATE TABLE public.supplier_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    order_number TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    description TEXT,
    items_affected JSONB DEFAULT '[]'::JSONB,
    issue_date DATE,
    order_date DATE,
    deadline_date DATE,
    photo TEXT,
    responsible TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,
    resolution_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS
ALTER TABLE public.supplier_occurrences ENABLE ROW LEVEL SECURITY;

-- Criar as políticas de segurança padrão
CREATE POLICY "Enable read access for all users" ON public.supplier_occurrences FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.supplier_occurrences FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.supplier_occurrences FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.supplier_occurrences FOR DELETE USING (true);
