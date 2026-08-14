const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const index = line.indexOf('=');
  if (index !== -1) {
    const key = line.substring(0, index).trim();
    const value = line.substring(index + 1).trim();
    env[key] = value;
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function listAaeLimpeza() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const limpezaStaff = data.filter(s => {
    const fn = (s.job_function || '').toUpperCase();
    const role = (s.role || '').toUpperCase();
    return fn.includes('LIMPEZA') || role.includes('LIMPEZA') || fn.includes('MANUTENÇÃO DE INFRAESTRUTURA/LIMPEZA');
  });

  console.log(`=== SERVIDORES DE AAE / LIMPEZA (${limpezaStaff.length} ENCONTRADOS) ===`);
  limpezaStaff.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name}`);
    console.log(`   Função: ${s.job_function}`);
    console.log(`   Turno: ${s.shift || 'N/I'}`);
    console.log(`   Role: ${s.role}`);
    console.log('---');
  });
}

listAaeLimpeza();
