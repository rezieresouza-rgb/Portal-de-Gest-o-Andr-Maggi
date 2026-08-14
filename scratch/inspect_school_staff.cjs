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

async function checkStaff() {
  const { data, error } = await supabase.from('staff').select('*');
  if (error) {
    console.error(error);
    return;
  }

  console.log('=== GESTÃO / DIREÇÃO / COORDENAÇÃO / SECRETARIA ===');
  data.forEach(s => {
    const r = (s.role || '').toUpperCase();
    const f = (s.job_function || '').toUpperCase();
    if (r === 'GESTAO' || r.includes('DIRET') || r.includes('COORD') || r.includes('SECRET') ||
        f.includes('DIRET') || f.includes('COORD') || f.includes('SECRET')) {
      console.log(`Name: ${s.name} | Role: ${s.role} | Function: ${s.job_function}`);
    }
  });
}

checkStaff();
