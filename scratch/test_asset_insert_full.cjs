const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function testSuffixInsert() {
  const cleanHeritage = 'N124584';
  const heritageToSave = `${cleanHeritage}#${Date.now()}`;

  console.log('Testing insert for heritageToSave:', heritageToSave);
  const { data: newAsset, error: assetError } = await supabase
    .from('assets')
    .insert([{
      description: 'MONITORIA TESTE N124584 DUPLICADO',
      location: 'MONITORIA',
      heritage_number: heritageToSave,
      condition: 'EXCELENTE',
      is_unserviceable: false,
      photo: null,
      unserviceable_data: null,
      acquisition_document: '265458',
      acquisition_year: '2026'
    }])
    .select();

  console.log('INSERT RESULT:', { newAsset, assetError });

  if (newAsset && newAsset[0]) {
    await supabase.from('assets').delete().eq('id', newAsset[0].id);
    console.log('Cleaned up test row successfully.');
  }
}

testSuffixInsert();
