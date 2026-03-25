
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // Check consumption_statements columns
  const { data: cols1, error: err1 } = await supabase.rpc('get_table_columns', { table_name: 'consumption_statements' });
  if (err1) {
      // Fallback: just select one row
      const { data: row } = await supabase.from('consumption_statements').select('*').limit(1);
      console.log("Sample consumption_statement:", row ? row[0] : "Empty");
  } else {
      console.log("Columns:", cols1);
  }

  // Check transactions columns
  const { data: row2 } = await supabase.from('transactions').select('*').limit(1);
  console.log("Sample transaction:", row2 ? row2[0] : "Empty");
}

run();
