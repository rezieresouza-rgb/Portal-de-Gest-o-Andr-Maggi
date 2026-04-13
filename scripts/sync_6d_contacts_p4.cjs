const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2666421", 
    name: "JEFERSON TARIFA DOS SANTOS", 
    guardian: "LEIA GARNICA TARIFA DOS SANTOS", 
    phone: "(66) 99770895 / (66) 996576639", 
    address: "RUA TULIPAS, 500, SETOR OESTE, MARIA ANTONIA, COLIDER-MT" 
  },
  { 
    reg: "2666169", 
    name: "JOÃO MIGUEL JESUS ARAUJO THOME", 
    guardian: "ROGERIO SOARES THOMÉ", 
    phone: "(66) 996542144 / (66) 996513139", 
    address: "RUA DAS AVENCAS, 644, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2666296", 
    name: "JOÃO VITOR DOS SANTOS MATEUS", 
    guardian: "ANGELICA DOS SANTOS CORREA", 
    phone: "(66) 997118367 / (66) 996384378", 
    address: "RUA DAS ROSAS, 460, MARIA ANTONIA, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade D (Part 4)...");

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

  console.log("Contact sync finished.");
}

syncContacts();
