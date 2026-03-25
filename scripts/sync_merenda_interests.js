
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const MERENDA_FUND_ID = '4f4f3469-6f96-419b-8994-3e9196b05322';

async function run() {
  console.log("--- SYNCING MERENDA INTERESTS (V3) ---");

  const interests = [
    { date: '2026-01-31', gross_value: 25.71, net_value: 25.71, tax_value: 0, tx_group: 'CUSTEIO', description: 'RENDIMENTOS BB RF CP AUTOMÁTICO - 01/2026', type: 'ENTRY', category: 'Rendimentos' },
    { date: '2026-02-28', gross_value: 33.76, net_value: 33.76, tax_value: 0, tx_group: 'CUSTEIO', description: 'RENDIMENTOS BB RF CP AUTOMÁTICO - 02/2026', type: 'ENTRY', category: 'Rendimentos' },
    { date: '2026-03-31', gross_value: 147.12, net_value: 147.12, tax_value: 0, tx_group: 'CUSTEIO', description: 'RENDIMENTOS BB RF CP AUTOMÁTICO - 03/2026', type: 'ENTRY', category: 'Rendimentos' },
  ];

  for (const int of interests) {
      const { error } = await supabase.from('transactions').insert({ ...int, fund_id: MERENDA_FUND_ID, created_at: new Date().toISOString() });
      if (error) console.error(`Error inserting ${int.description}:`, error.message);
      else console.log(`Inserted: ${int.description}`);
  }
}

run();
