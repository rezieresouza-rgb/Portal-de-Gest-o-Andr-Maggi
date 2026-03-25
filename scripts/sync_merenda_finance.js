
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const MERENDA_FUND_ID = '4f4f3469-6f96-419b-8994-3e9196b05322';

async function run() {
  console.log("--- SYNCING MERENDA FINANCE (V3) ---");

  // Fix Repasses
  await supabase.from('transactions').update({ 
    gross_value: 0, net_value: 0, tax_value: 0, tx_group: 'CUSTEIO',
    description: '1º REPASSE ESTADUAL 2026 (VALOR NÃO LOCALIZADO NO EXTRATO)' 
  }).eq('fund_id', MERENDA_FUND_ID).ilike('description', '%1º REPASSE%');

  await supabase.from('transactions').update({ 
    gross_value: 20086.00, net_value: 20086.00, tax_value: 0, tx_group: 'CUSTEIO',
    date: '2026-02-12', description: 'REPASSE ESTADUAL 02/2026' 
  }).eq('fund_id', MERENDA_FUND_ID).ilike('description', '%REPASSE%02/2026%');

  await supabase.from('transactions').update({ 
    gross_value: 20501.00, net_value: 20501.00, tax_value: 0, tx_group: 'CUSTEIO',
    date: '2026-03-24', description: 'REPASSE ESTADUAL 03/2026' 
  }).eq('fund_id', MERENDA_FUND_ID).ilike('description', '%REPASSE%03/2026%');

  const expenses = [
    { date: '2026-02-23', gross_value: 4343.63, net_value: 4343.63, tax_value: 0, tx_group: 'CUSTEIO', description: 'PAGAMENTO: NOVO ACOUGUE E MERCEARIA', type: 'EXPENSE', category: 'Alimentação' },
    { date: '2026-03-03', gross_value: 621.89, net_value: 621.89, tax_value: 0, tx_group: 'CUSTEIO', description: 'PAGAMENTO: RAROS SABOR LTDA', type: 'EXPENSE', category: 'Alimentação' },
    { date: '2026-03-05', gross_value: 227.76, net_value: 227.76, tax_value: 0, tx_group: 'CUSTEIO', description: 'PAGAMENTO: J ASSIS E CIA LTDA', type: 'EXPENSE', category: 'Alimentação' },
    { date: '2026-03-06', gross_value: 5870.30, net_value: 5870.30, tax_value: 0, tx_group: 'CUSTEIO', description: 'PAGAMENTO: MERCADO BOM JESUS', type: 'EXPENSE', category: 'Alimentação' },
    { date: '2026-03-11', gross_value: 1838.18, net_value: 1838.18, tax_value: 0, tx_group: 'CUSTEIO', description: 'PAGAMENTO: SUPERMERCADO DINABRAS', type: 'EXPENSE', category: 'Alimentação' },
    { date: '2026-03-12', gross_value: 429.00, net_value: 429.00, tax_value: 0, tx_group: 'CUSTEIO', description: 'PAGAMENTO: N. C. DOS SANTOS', type: 'EXPENSE', category: 'Alimentação' },
    { date: '2026-03-19', gross_value: 4007.24, net_value: 4007.24, tax_value: 0, tx_group: 'CUSTEIO', description: 'PAGAMENTO: CASA DE CARNE E MERCADO M / NOVO ACOUGUE', type: 'EXPENSE', category: 'Alimentação' },
  ];

  for (const exp of expenses) {
      const { error } = await supabase.from('transactions').insert({ ...exp, fund_id: MERENDA_FUND_ID, created_at: new Date().toISOString() });
      if (error) console.error(`Error inserting ${exp.description}:`, error.message);
      else console.log(`Inserted: ${exp.description}`);
  }
}

run();
