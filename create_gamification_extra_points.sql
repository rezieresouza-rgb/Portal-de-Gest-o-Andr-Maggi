-- Tabela de Pontos Extras da Liga Maggi (Gamificação Escolar)
CREATE TABLE IF NOT EXISTS public.gamification_extra_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_name TEXT NOT NULL,
    student_id TEXT,
    student_name TEXT,
    bimestre TEXT NOT NULL,
    date DATE NOT NULL,
    points NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gamification_extra_class ON public.gamification_extra_points (classroom_name);
CREATE INDEX IF NOT EXISTS idx_gamification_extra_bimestre ON public.gamification_extra_points (bimestre);
CREATE INDEX IF NOT EXISTS idx_gamification_extra_date ON public.gamification_extra_points (date);

ALTER TABLE public.gamification_extra_points ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'gamification_extra_points'
          AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users"
            ON public.gamification_extra_points
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
