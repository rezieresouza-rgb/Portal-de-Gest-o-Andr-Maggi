
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const MERENDA_FUND_ID = '4f4f3469-6f96-419b-8994-3e9196b05322';

async function run() {
  console.log("--- CLEANING UP MERENDA 2026 TRANSACTIONS ---");

  // Delete expenses and interests for 2026
  // Keep the repasses (we update them instead)
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('fund_id', MERENDA_FUND_ID)
    .gte('date', '2026-01-01')
    .ilike('description', 'PAGAMENTO%');
    
  if (error) console.error("Error cleaning expenses:", error.message);

  const { error: error2 } = await supabase
    .from('transactions')
    .delete()
    .eq('fund_id', MERENDA_FUND_ID)
    .gte('date', '2026-01-01')
    .ilike('description', 'RENDIMENTOS%');
  
  if (error2) console.error("Error cleaning interests:", error2.message);

  console.log("Cleanup completed.");
}

run();
