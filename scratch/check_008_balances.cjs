const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("=== INSPECTING CONTRATO 008/2026 (SERGIO SCARPIN) IN SUPABASE ===");

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('*, items:contract_items(*), supplier:suppliers(*)')
    .ilike('number', '%008/2026%');

  if (error) {
    console.error("Error fetching 008 contract:", error);
    return;
  }

  if (contracts && contracts.length > 0) {
    contracts.forEach(c => {
      console.log(`\nContract: ${c.number} | Supplier: ${c.supplier?.name} | Status: ${c.status}`);
      c.items.forEach(i => {
        const remaining = i.contracted_quantity - i.acquired_quantity;
        console.log(`  - Item [${i.id}] ${i.description}: Contracted = ${i.contracted_quantity}, Acquired = ${i.acquired_quantity}, Remaining = ${remaining} ${i.unit} (R$ ${i.unit_price})`);
      });
    });
  } else {
    console.log("Contract 008/2026 not found in Supabase DB.");
  }

  // Also check if there are other contracts with ALHO BRANCO, BATATA INGLESA, etc.
  console.log("\n=== ALL CONTRACT ITEMS IN DB FOR ALHO BRANCO & BATATA INGLESA ===");
  const { data: allItems } = await supabase
    .from('contract_items')
    .select('*, contract:contracts(number, status, supplier:suppliers(name))')
    .or('description.ilike.%alho%,description.ilike.%batata%,description.ilike.%cebola%');

  allItems?.forEach(i => {
    console.log(`- Contract ${i.contract?.number} (${i.contract?.supplier?.name}): ${i.description} => Contracted: ${i.contracted_quantity}, Acquired: ${i.acquired_quantity}, Remaining: ${i.contracted_quantity - i.acquired_quantity}`);
  });
}

run();
