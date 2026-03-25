
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*, funds(name, full_name)')
    .order('date', { ascending: true });

  if (error) {
    console.error("Error fetching transactions:", error);
    return;
  }

  console.log("Date       | Fund       | Type    | Value      | Description");
  console.log("-----------|------------|---------|------------|------------");
  transactions.forEach(tx => {
    const fundName = tx.funds?.name || 'ORPHAN';
    const type = tx.type === 'ENTRY' ? 'ENTRY' : 'EXPENSE';
    console.log(`${tx.date} | ${fundName.padEnd(10)} | ${type.padEnd(7)} | ${Number(tx.gross_value).toFixed(2).padStart(10)} | ${tx.description}`);
  });
}

run();
