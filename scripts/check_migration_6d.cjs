/**
 * Migração da tabela student_movements via Supabase REST API
 * Usa a anon key mas executa via rpc/sql function
 */
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// SQL para criar uma RPC function segura que faz a migração
// Esta abordagem executa via a anon key usando uma função SQL criada pelo admin
// Como alternativa, vamos tentar inserir manualmente verificando quais colunas existem

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyAndShowSQL() {
  console.log('🔍 Verificando estrutura atual da tabela...\n');
  
  // Inserir registro de teste para descobrir quais campos existem
  const { error: err1 } = await supabase.from('student_movements').insert([{
    student_id: '00000000-0000-0000-0000-000000000000',
    movement_type: 'OUTROS',
    description: 'TESTE MIGRACAO',
    movement_date: '2026-01-01',
    destination_school: 'TESTE'
  }]);
  
  if (err1) {
    if (err1.message.includes('destination_school')) {
      console.log('❌ Coluna "destination_school" NÃO existe ainda.\n');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('EXECUTE ESTE SQL NO PAINEL DO SUPABASE:');
      console.log('https://supabase.com/dashboard/project/wwrjskjhemaapnwtumlt/sql/new');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log(`ALTER TABLE student_movements
  ADD COLUMN IF NOT EXISTS destination_school TEXT,
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS days_absent INTEGER,
  ADD COLUMN IF NOT EXISTS cid_code TEXT,
  ADD COLUMN IF NOT EXISTS doctor_name TEXT,
  ADD COLUMN IF NOT EXISTS responsible_name TEXT,
  ADD COLUMN IF NOT EXISTS return_date DATE;

CREATE INDEX IF NOT EXISTS idx_movements_type ON student_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_date ON student_movements(movement_date);`);
      console.log('\n═══════════════════════════════════════════════════════════════');
    } else if (err1.code === '23503') {
      // FK violation = campo existe mas o UUID de student_id é inválido
      console.log('✅ Colunas já existem! Tabela atualizada.\n');
    } else {
      console.log('Erro ao testar:', err1.message);
      console.log('Code:', err1.code);
    }
  } else {
    // Limpeza do registro de teste
    await supabase.from('student_movements')
      .delete()
      .eq('student_id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Colunas já existem! Tabela atualizada.\n');
  }
}

verifyAndShowSQL().catch(e => console.error('Erro:', e.message));
