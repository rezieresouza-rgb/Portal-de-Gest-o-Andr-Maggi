const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2339491", 
    name: "TAKAKPYNEITI KABRAL METUKTIRE", 
    guardian: "TAKATUM METUKTIRE", 
    phone: "(66) 984259510 / (66) 999443578", 
    address: "AV. PARANÁ, 1277, BOA ESPERANÇA, COLIDER-MT" 
  },
  { 
    reg: "2286447", 
    name: "YAN SILVA NUNES", 
    guardian: "JULIANA APARECIDA DA SILVA", 
    phone: "(66) 997180374 / (66) 984487607", 
    address: "RUA JASMIM, 575, CELIDIO MARQUES, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade D (Part 6 - Final)...");

  for (const s of studentsData) {
    console.log(`Updating: ${s.name}...`);
    const { data, error } = await supabase
      .from('students')
      .update({
        guardian_name: s.guardian,
        contact_phone: s.phone,
        address: s.address
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

  console.log("Final contact sync finished.");
}

syncContacts();
