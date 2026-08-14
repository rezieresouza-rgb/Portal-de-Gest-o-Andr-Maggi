const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function verifyToday() {
  const { data, error } = await supabase
    .from('merenda_inventory_history')
    .select('*')
    .eq('date', '2026-07-24')
    .order('timestamp', { ascending: true });

  console.log('RECORDS FOR 24/07/2026:', { error, count: data?.length });
  if (data) {
    data.forEach(r => {
      const items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items;
      console.log(`\nFicha: ID=${r.id} | Data=${r.date} | Turno=${r.turno} | Responsavel=${r.responsavel} | Total Itens=${items?.length}`);
      console.log('Primeiros 5 itens preenchidos:');
      items.slice(0, 5).forEach(i => console.log(`  - ${i.name} (${i.unit}): Saldo Ant=${i.previousBalance}, Entradas=${i.entries}, Saídas=${i.outputs}, Saldo Atual=${i.previousBalance + i.entries - i.outputs}`));
    });
  }
}

verifyToday();
