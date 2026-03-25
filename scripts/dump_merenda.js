
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const MERENDA_FUND_ID = '4f4f3469-6f96-419b-8994-3e9196b05322';

async function run() {
  const { data: trans, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('fund_id', MERENDA_FUND_ID)
    .gte('date', '2026-01-01')
    .order('date', { ascending: true });

  if (error) throw error;
  
  trans.forEach(tx => {
      console.log(`${tx.date} | ${tx.type} | gross: ${tx.gross_value} | desc: ${tx.description}`);
  });
}

run();
