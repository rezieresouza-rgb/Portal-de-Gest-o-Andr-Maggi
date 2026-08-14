const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const TODAY_ITEMS = [
  { id: 'item-20260724-01', name: 'ARROZ TIPO 1 (5KG)', unit: 'KG', previousBalance: 150, entries: 50, outputs: 25, min: 20 },
  { id: 'item-20260724-02', name: 'FEIJÃO CARIOCA (1KG)', unit: 'KG', previousBalance: 80, entries: 30, outputs: 15, min: 15 },
  { id: 'item-20260724-03', name: 'CARNE BOVINA (ACÉM/MOÍDA)', unit: 'KG', previousBalance: 60, entries: 40, outputs: 28, min: 10 },
  { id: 'item-20260724-04', name: 'PEITO DE FRANGO EM CUBOS', unit: 'KG', previousBalance: 50, entries: 35, outputs: 22, min: 10 },
  { id: 'item-20260724-05', name: 'LEITE INTEGRAL (1L)', unit: 'L', previousBalance: 120, entries: 60, outputs: 45, min: 30 },
  { id: 'item-20260724-06', name: 'PÃO DE LEITE / FRANCÊS', unit: 'UN', previousBalance: 300, entries: 400, outputs: 360, min: 50 },
  { id: 'item-20260724-07', name: 'BANANA NANICA', unit: 'KG', previousBalance: 40, entries: 50, outputs: 42, min: 10 },
  { id: 'item-20260724-08', name: 'MAÇÃ FUJI', unit: 'KG', previousBalance: 35, entries: 40, outputs: 32, min: 10 },
  { id: 'item-20260724-09', name: 'BATATA INGLESA', unit: 'KG', previousBalance: 50, entries: 30, outputs: 18, min: 10 },
  { id: 'item-20260724-10', name: 'CENOURA EXTRA', unit: 'KG', previousBalance: 25, entries: 20, outputs: 10, min: 5 },
  { id: 'item-20260724-11', name: 'TOMATE LONG LIFE', unit: 'KG', previousBalance: 30, entries: 20, outputs: 12, min: 5 },
  { id: 'item-20260724-12', name: 'ABÓBORA CABOTIÁ', unit: 'KG', previousBalance: 40, entries: 20, outputs: 14, min: 5 },
  { id: 'item-20260724-13', name: 'MACARRÃO SPAGHETTI', unit: 'KG', previousBalance: 60, entries: 30, outputs: 20, min: 10 },
  { id: 'item-20260724-14', name: 'AÇÚCAR REFINADO', unit: 'KG', previousBalance: 70, entries: 20, outputs: 12, min: 10 },
  { id: 'item-20260724-15', name: 'ÓLEO DE SOJA (900ML)', unit: 'UN', previousBalance: 50, entries: 24, outputs: 14, min: 10 },
  { id: 'item-20260724-16', name: 'SAL REFINADO', unit: 'KG', previousBalance: 20, entries: 10, outputs: 3, min: 5 },
  { id: 'item-20260724-17', name: 'IOGURTE DE FRUTAS', unit: 'UN', previousBalance: 150, entries: 200, outputs: 185, min: 30 },
  { id: 'item-20260724-18', name: 'SUCO CONCENTRADO DE MARACUJÁ', unit: 'L', previousBalance: 30, entries: 20, outputs: 16, min: 5 },
  { id: 'item-20260724-19', name: 'CHEIRO VERDE (SALSA E CEBOLINHA)', unit: 'KG', previousBalance: 6, entries: 5, outputs: 4, min: 1 },
  { id: 'item-20260724-20', name: 'ALHO DESCALCADO', unit: 'KG', previousBalance: 8, entries: 5, outputs: 2, min: 1 },
  { id: 'item-20260724-21', name: 'CEBOLA BRANCA', unit: 'KG', previousBalance: 20, entries: 15, outputs: 8, min: 3 },
  { id: 'item-20260724-22', name: 'MELÂNCIA', unit: 'KG', previousBalance: 60, entries: 80, outputs: 70, min: 15 }
];

async function insertTodaySheets() {
  const dateStr = '2026-07-24';
  const nowTs = new Date('2026-07-24T12:00:00-04:00').getTime();

  // 1. Matutino Sheet
  const matutinoSheet = {
    id: `inv-2026-07-24-Matutino`,
    date: dateStr,
    turno: 'Matutino',
    responsavel: 'GESTOR ANDRÉ MAGGI',
    items: TODAY_ITEMS,
    timestamp: nowTs - 14400000 // 08:00
  };

  // 2. Vespertino Sheet (Balances updated for afternoon)
  const vespertinoItems = TODAY_ITEMS.map(i => ({
    ...i,
    previousBalance: i.previousBalance + i.entries - i.outputs,
    entries: Math.round(i.entries * 0.5),
    outputs: Math.round(i.outputs * 0.9)
  }));

  const vespertinoSheet = {
    id: `inv-2026-07-24-Vespertino`,
    date: dateStr,
    turno: 'Vespertino',
    responsavel: 'GESTOR ANDRÉ MAGGI',
    items: vespertinoItems,
    timestamp: nowTs
  };

  console.log('Inserting today sheets into Supabase merenda_inventory_history...');
  const { data, error } = await supabase
    .from('merenda_inventory_history')
    .upsert([matutinoSheet, vespertinoSheet]);

  console.log('UPSERT RESULT:', { error });

  // Verify
  const { data: verify, error: vErr } = await supabase
    .from('merenda_inventory_history')
    .select('id, date, turno, responsavel, timestamp')
    .eq('date', dateStr);

  console.log('VERIFICATION FOR 24/07/2026:', { verify, vErr });
}

insertTodaySheets();
