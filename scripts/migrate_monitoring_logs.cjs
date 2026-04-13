const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function migrate() {
  console.log('--- MIGRATION: CREATE active_search_monitoring_logs ---');

  const { error } = await supabase.rpc('execute_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS active_search_monitoring_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          student_id UUID REFERENCES students(id) ON DELETE CASCADE,
          action_date DATE NOT NULL DEFAULT CURRENT_DATE,
          action_time TIME NOT NULL DEFAULT CURRENT_TIME,
          action_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          contact_person VARCHAR(255),
          is_urgent BOOLEAN DEFAULT false,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_monitoring_student ON active_search_monitoring_logs(student_id);
    `
  });

  if (error) {
    // If RPC fails (maybe execute_sql doesn't exist), we'll try raw SQL via a different method if available
    // But usually in these projects, we create a temporary endpoint or use the management api
    // Looking at the codebase, I don't see a migration runner.
    // I'll try to use raw SQL if possible, or just inform the user we need to run this in Supabase SQL Editor.
    console.error('❌ Erro na migração:', error.message);
    console.log('--- ALTERNATIVA: Copie o SQL abaixo e cole no SQL Editor do Supabase ---');
    console.log(`
      CREATE TABLE active_search_monitoring_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          student_id UUID REFERENCES students(id) ON DELETE CASCADE,
          action_date DATE NOT NULL DEFAULT CURRENT_DATE,
          action_time TIME NOT NULL DEFAULT CURRENT_TIME,
          action_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          contact_person VARCHAR(255),
          is_urgent BOOLEAN DEFAULT false,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_monitoring_student ON active_search_monitoring_logs(student_id);
    `);
  } else {
    console.log('✅ Migração concluída com sucesso!');
  }
}

migrate();
