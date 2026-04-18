--- MIGRATION: CRIAÇÃO DA TABELA DE CONSELHO DE CLASSE ---

CREATE TABLE IF NOT EXISTS class_councils (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    bimestre VARCHAR(20) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    general_diagnosis TEXT,
    student_observations JSONB DEFAULT '[]'::jsonb,
    decisions TEXT,
    attendance_teachers TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'RASCUNHO', -- RASCUNHO, FINALIZADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexação para performance
CREATE INDEX IF NOT EXISTS idx_class_council_classroom ON class_councils(classroom_id);
CREATE INDEX IF NOT EXISTS idx_class_council_bimestre ON class_councils(bimestre);

COMMENT ON TABLE class_councils IS 'Registros de reuniões de Conselho de Classe por turma e bimestre.';
