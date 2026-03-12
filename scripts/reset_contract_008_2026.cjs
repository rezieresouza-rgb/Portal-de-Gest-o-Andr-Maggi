const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearContract008() {
  const contractId = '6c133ea4-eb28-40d6-9091-7f665dc54bce'; // ID for 008/2026

  try {
    console.log(`Starting reset for contract ${contractId} (008/2026)...`);

    // 1. Delete all payment guides
    console.log("Deleting all payment guides...");
    const { error: pgError } = await supabase
      .from('payment_guides')
      .delete()
      .eq('contract_id', contractId);

    if (pgError) throw pgError;
    console.log("✓ Payment guides deleted (cascade will handle items).");

    // 2. Delete all contract events (logs)
    console.log("Deleting all contract execution events...");
    const { error: evError } = await supabase
      .from('contract_events')
      .delete()
      .eq('contract_id', contractId);

    if (evError) throw evError;
    console.log("✓ Contract events deleted.");

    // 3. Reset acquired_quantity to 0 for all items
    console.log("Resetting acquired quantities to 0...");
    const { error: itemsError } = await supabase
      .from('contract_items')
      .update({ acquired_quantity: 0 })
      .eq('contract_id', contractId);

    if (itemsError) throw itemsError;
    console.log("✓ All items reset to 0 acquired quantity.");

    console.log("\nSuccess! Contract 008/2026 has been reset to its initial state.");
  } catch (err) {
    console.error("Error during reset:", err);
  }
}

clearContract008();
