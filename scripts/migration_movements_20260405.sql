-- MIGRATION: Adicionar campos de detalhamento em student_movements
-- Data: 2026-04-05

ALTER TABLE student_movements 
ADD COLUMN IF NOT EXISTS transfer_subtype TEXT,
ADD COLUMN IF NOT EXISTS is_reclassified BOOLEAN DEFAULT false;

COMMENT ON COLUMN student_movements.transfer_subtype IS 'INTERNA (Turma) ou EXTERNA (Escola)';
COMMENT ON COLUMN student_movements.is_reclassified IS 'Define se o aluno foi reclassificado';
