const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const corrections = [
  { name: "MISAEL LUIZ DA SILVA DIAS", oldReg: "2670913", newReg: "2670313" },
  { name: "GUSTAVO HENRIQUE DE PAULA DE LARA", oldReg: "2286436", newReg: "2286438" },
  { name: "GUILHERME SOUZA ALVES", oldReg: "2302994", newReg: "2302834" },
  { name: "MIKAELY TIBURCIO SILVA", oldReg: "2325694", newReg: "2325564" },
  { name: "FELIPE NUNES DA SILVA", oldReg: "2723256", newReg: "2723258" },
  { name: "DAVI CARVALHO SALMENTO", oldReg: "2726402", newReg: "2725402" }
];

async function applyCorrections() {
  console.log("Applying registration and PAED/Transport corrections for 6th Grade A...");

  for (const c of corrections) {
    console.log(`Updating: ${c.name}...`);
    const { data, error } = await supabase
      .from('students')
      .update({
        registration_number: c.newReg,
        paed: false,
        school_transport: false
      })
      .eq('name', c.name) // Match by name to update the reg number correctly
      .select('name, registration_number');

    if (error) {
      console.error(`  Error updating ${c.name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`  ✓ Successfully updated: ${data[0].name} -> New Reg: ${data[0].registration_number}`);
    } else {
      console.warn(`  Student ${c.name} not found by name.`);
    }
  }

  console.log("Corrections finished.");
}

applyCorrections();
