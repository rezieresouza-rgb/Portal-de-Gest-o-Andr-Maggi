
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const MERENDA_FUND_ID = '4f4f3469-6f96-419b-8994-3e9196b05322';

async function run() {
  const { data: trans, error } = await supabase
    .from('transactions')
    .select('gross_value, type, description')
    .eq('fund_id', MERENDA_FUND_ID);

  if (error) throw error;
  
  let balance = 0;
  trans.forEach(tx => {
      const val = Number(tx.gross_value) || 0;
      if (tx.type === 'ENTRY') balance += val;
      else balance -= val;
  });
  
  console.log(`FINAL RECONCILED BALANCE: R$ ${balance.toFixed(2)}`);
}

run();
