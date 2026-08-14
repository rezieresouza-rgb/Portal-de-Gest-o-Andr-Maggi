const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function checkInventory() {
  const { data, error } = await supabase
    .from('merenda_inventory_history')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(5);

  console.log('HISTORY IN SUPABASE (Top 5):', { error, count: data?.length });
  if (data && data.length > 0) {
    console.log('Latest record:', {
      id: data[0].id,
      date: data[0].date,
      turno: data[0].turno,
      responsavel: data[0].responsavel,
      itemCount: Array.isArray(data[0].items) ? data[0].items.length : typeof data[0].items,
      sampleItem: Array.isArray(data[0].items) ? data[0].items[0] : data[0].items
    });
  }
}

checkInventory();
