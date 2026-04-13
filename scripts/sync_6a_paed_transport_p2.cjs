const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  // Page 2 - 5 students
  { reg: "2304199", name: "JASMIM RAFAELA AMÂNCIO DE LIMA", paed: false, transport: false },
  { reg: "2723258", name: "FELIPE NUNES DA SILVA", paed: false, transport: false },
  { reg: "2397899", name: "FERNANDO DJARA TXUCARRAMÃE", paed: false, transport: false },
  { reg: "2347759", name: "EMILLY VITÓRIA GOMES DOS SANTOS", paed: false, transport: false },
  { reg: "2725402", name: "DAVI CARVALHO SALMENTO", paed: false, transport: false }
];

async function syncPaedTransport() {
  console.log("Finalizing PAED and Transport sync for 6th Grade A...");

  for (const s of studentsData) {
    console.log(`Updating: ${s.name}...`);
    const { data, error } = await supabase
      .from('students')
      .update({
        paed: s.paed,
        school_transport: s.transport
      })
      .eq('registration_number', s.reg)
      .select('name');

    if (error) {
      console.error(`  Error updating ${s.name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`  ✓ Successfully updated: ${data[0].name}`);
    } else {
      console.warn(`  Student with registration ${s.reg} not found.`);
    }
  }

  console.log("Final PAED and Transport sync finished.");
}

syncPaedTransport();
