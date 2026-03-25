
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key missing in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMerenda() {
  try {
    // 1. Get Merenda Fund ID
    const { data: funds, error: fundError } = await supabase
      .from('funds')
      .select('id, name, full_name')
      .eq('name', 'merenda');

    if (fundError) throw fundError;
    if (!funds || funds.length === 0) {
      console.log("Merenda fund not found.");
      return;
    }

    const merendaId = funds[0].id;
    console.log(`Fund: ${funds[0].full_name} (${merendaId})`);

    // Fetch all transactions for this fund
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('fund_id', merendaId);

    if (txError) throw txError;

    console.log("\n--- TRANSACTIONS ---");
    let totalEntries = 0;
    let totalExpenses = 0;

    transactions.forEach(tx => {
      const type = tx.type === 'ENTRY' ? 'ENTRADA' : 'SÍDA';
      const val = Number(tx.gross_value);
      console.log(`[${tx.date}] ${type.padEnd(8)} | R$ ${val.toFixed(2).padStart(10)} | ${tx.description}`);
      
      if (tx.type === 'ENTRY') totalEntries += val;
      else totalExpenses += val;
    });

    console.log("\n--- SUMMARY ---");
    console.log(`Total Entries:  R$ ${totalEntries.toFixed(2)}`);
    console.log(`Total Expenses: R$ ${totalExpenses.toFixed(2)}`);
    console.log(`Balance:        R$ ${(totalEntries - totalExpenses).toFixed(2)}`);

  } catch (err) {
    console.error("Error:", err);
  }
}

checkMerenda();
