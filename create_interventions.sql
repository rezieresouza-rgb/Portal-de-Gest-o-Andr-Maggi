CREATE TABLE pedagogical_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_name VARCHAR(255) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    action_plan TEXT NOT NULL,
    deadline DATE,
    status VARCHAR(50) DEFAULT 'EM_ANDAMENTO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE pedagogical_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
    ON pedagogical_interventions FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all users"
    ON pedagogical_interventions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for all users"
    ON pedagogical_interventions FOR UPDATE
    USING (true)
    WITH CHECK (true);
