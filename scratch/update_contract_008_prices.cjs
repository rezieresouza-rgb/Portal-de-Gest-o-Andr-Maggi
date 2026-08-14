const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase config missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Searching for contract 008/2026/SEDUC/MT...");
  const { data: contracts, error: cErr } = await supabase
    .from('contracts')
    .select('id, number')
    .ilike('number', '%008/2026%');

  if (cErr) {
    console.error("Error fetching contracts:", cErr);
    return;
  }

  console.log("Found contracts:", contracts);

  if (contracts && contracts.length > 0) {
    for (const c of contracts) {
      console.log(`Updating items for contract ${c.number} (${c.id})...`);
      
      // Update CEBOLA BRANCA
      const { data: u1, error: e1 } = await supabase
        .from('contract_items')
        .update({ unit_price: 7.99 })
        .eq('contract_id', c.id)
        .ilike('description', '%CEBOLA%');
      console.log("Updated CEBOLA BRANCA to 7.99", e1 || "Success");

      // Update MAÇÃ FUJI
      const { data: u2, error: e2 } = await supabase
        .from('contract_items')
        .update({ unit_price: 15.46 })
        .eq('contract_id', c.id)
        .ilike('description', '%MAÇÃ%');
      console.log("Updated MAÇÃ FUJI to 15.46", e2 || "Success");

      // Update BATATA INGLESA
      const { data: u3, error: e3 } = await supabase
        .from('contract_items')
        .update({ unit_price: 11.27 })
        .eq('contract_id', c.id)
        .ilike('description', '%BATATA%');
      console.log("Updated BATATA INGLESA to 11.27", e3 || "Success");
    }
  } else {
    console.log("Contract 008/2026 not found in Supabase DB (using initialData fallback).");
  }
}

run();
