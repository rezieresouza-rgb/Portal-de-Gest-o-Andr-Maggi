-- ==============================================================================
-- MIGRAÇÃO: SEGREGACÃO POR ANO LETIVO (2026 E 2027)
-- DIALETO: POSTGRESQL / SUPABASE
-- ==============================================================================

-- 1. TABELA DE ANOS LETIVOS
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANEJAMENTO', -- 'PLANEJAMENTO', 'ATIVO', 'ENCERRADO', 'ARQUIVADO'
    is_active BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    total_school_days INT DEFAULT 200,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. POPULAR ANOS LETIVOS INICIAIS (2026 e 2027)
INSERT INTO academic_years (year, name, status, is_active, start_date, end_date, total_school_days, description)
VALUES 
    (2026, 'Ano Letivo 2026', 'ATIVO', true, '2026-02-02', '2026-12-18', 200, 'Ano Letivo Vigente'),
    (2027, 'Ano Letivo 2027', 'PLANEJAMENTO', false, '2027-02-01', '2027-12-17', 200, 'Ano Letivo 2027 - Planejamento e Matrículas')
ON CONFLICT (year) DO NOTHING;

-- 3. ADICIONAR COLUNAS NAS TABELAS DE TURMAS
ALTER TABLE classrooms 
ADD COLUMN IF NOT EXISTS academic_year INT DEFAULT 2026,
ADD COLUMN IF NOT EXISTS grade_level VARCHAR(50);

-- Atualizar turmas existentes sem ano para 2026
UPDATE classrooms 
SET academic_year = 2026 
WHERE academic_year IS NULL;

-- Criar índice para consultas rápidas por ano letivo
CREATE INDEX IF NOT EXISTS idx_classrooms_academic_year ON classrooms(academic_year);

-- 4. ADICIONAR COLUNA EM ENROLLMENTS SE NECESSÁRIO
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS academic_year INT DEFAULT 2026;

UPDATE enrollments 
SET academic_year = 2026 
WHERE academic_year IS NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year ON enrollments(academic_year);
