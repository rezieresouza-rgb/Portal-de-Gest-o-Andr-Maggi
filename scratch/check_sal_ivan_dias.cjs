const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("=== INSPECTING SAL ITEMS IN CONTRACTS ===");

  // 1. Fetch contracts for IVAN DIAS
  const { data: contracts, error: cErr } = await supabase
    .from('contracts')
    .select('*, items:contract_items(*), supplier:suppliers(*)')
    .or('number.ilike.%003/2026%,number.ilike.%IVAN%');

  if (cErr) {
    console.error("Error fetching Ivan Dias contract:", cErr);
  } else {
    console.log("Contracts for Ivan Dias:", contracts.map(c => ({ id: c.id, number: c.number, supplier: c.supplier?.name })));
    contracts.forEach(c => {
      console.log(`\nContract ${c.number} (${c.supplier?.name}):`);
      c.items.forEach(i => {
        if (i.description.toUpperCase().includes('SAL')) {
          console.log(`  - Item [${i.id}] ${i.description}: Contracted = ${i.contracted_quantity}, Acquired = ${i.acquired_quantity}, Remaining = ${i.contracted_quantity - i.acquired_quantity} ${i.unit} (R$ ${i.unit_price})`);
        }
      });
    });
  }

  // 2. Fetch all contract items containing 'SAL' across ALL contracts
  console.log("\n=== ALL CONTRACT ITEMS CONTAINING 'SAL' IN DB ===");
  const { data: allSalItems } = await supabase
    .from('contract_items')
    .select('*, contract:contracts(number, status, supplier:suppliers(name))');

  allSalItems?.filter(i => i.description.toUpperCase().includes('SAL')).forEach(i => {
    console.log(`- Contract ${i.contract?.number} (${i.contract?.supplier?.name}): ${i.description} => Contracted: ${i.contracted_quantity}, Acquired: ${i.acquired_quantity}, Remaining: ${i.contracted_quantity - i.acquired_quantity} ${i.unit}`);
  });
}

run();
