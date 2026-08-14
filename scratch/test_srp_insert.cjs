const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function testInsert() {
  const h1 = 'SRP';
  const h2 = 'SRP-' + Date.now();

  console.log('Inserting 1:', h1);
  const { data: d1, error: e1 } = await supabase.from('assets').insert([{
    description: 'TESTE DUPLICADO SRP 1',
    location: 'SALA TESTE',
    heritage_number: h1,
    condition: 'BOM',
    is_unserviceable: false
  }]).select();

  console.log('Result 1:', { d1, e1 });

  console.log('Inserting 2:', h2);
  const { data: d2, error: e2 } = await supabase.from('assets').insert([{
    description: 'TESTE DUPLICADO SRP 2',
    location: 'SALA TESTE',
    heritage_number: h2,
    condition: 'BOM',
    is_unserviceable: false
  }]).select();

  console.log('Result 2:', { d2, e2 });

  // Cleanup
  if (d1 && d1[0]) await supabase.from('assets').delete().eq('id', d1[0].id);
  if (d2 && d2[0]) await supabase.from('assets').delete().eq('id', d2[0].id);
  console.log('Cleanup completed.');
}

testInsert();
