
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
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
  
  let output = "";
  let totalEntries = 0;
  let totalExpenses = 0;

  trans.forEach(tx => {
      const val = Number(tx.gross_value) || 0;
      output += `${tx.date} | ${tx.type.padEnd(8)} | gross: ${val.toFixed(2).padStart(10)} | desc: ${tx.description}\n`;
      if (tx.type === 'ENTRY') totalEntries += val;
      else totalExpenses += val;
  });
  
  output += `\nTOTAL ENTRIES:  R$ ${totalEntries.toFixed(2)}\n`;
  output += `TOTAL EXPENSES: R$ ${totalExpenses.toFixed(2)}\n`;
  output += `FINAL BALANCE:  R$ ${(totalEntries - totalExpenses).toFixed(2)}\n`;

  fs.writeFileSync('merenda_dump_simple.txt', output);
  console.log("Dump saved to merenda_dump_simple.txt");
}

run();
