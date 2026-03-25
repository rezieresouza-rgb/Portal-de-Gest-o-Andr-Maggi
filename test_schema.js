import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_string: 'ALTER TABLE consumption_statements ADD COLUMN IF NOT EXISTS payment_date DATE, ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);'
  });
  if (error) {
    console.log("RPC failed, trying regular insert...", error.message);
    const { error: error2 } = await supabase.from('consumption_statements').update({ payment_date: null }).eq('id', '00000000-0000-0000-0000-000000000000');
    if (error2 && error2.code === 'PGRST204') {
        console.log("Column payment_date does not exist.");
    } else {
        console.log("Error or Success:", error2);
    }
  } else {
    console.log("Success:", data);
  }
}
run();
