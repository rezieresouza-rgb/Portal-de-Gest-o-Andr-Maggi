import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: d1, error: e1 } = await supabase.from('payment_guides').select('id').limit(1);
  console.log("payment_guides:", e1 ? e1.message : "Exists");
  const { data: d2, error: e2 } = await supabase.from('payment_guide_items').select('id').limit(1);
  console.log("payment_guide_items:", e2 ? e2.message : "Exists");
  const { data: d3, error: e3 } = await supabase.from('consumption_statements').select('id').limit(1);
  console.log("consumption_statements:", e3 ? e3.message : "Exists");
}
run();
