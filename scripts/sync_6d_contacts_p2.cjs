const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2289783", 
    name: "ELOIZA DE SOUZA DIAS", 
    guardian: "MARIA LUCIANA DE SOUZA", 
    phone: "(66) 996518275 / (66) 996841020 / (66) 997139238", 
    address: "RUA YPÊ ROSA, 04, DOS YPÊS, COLIDER-MT" 
  },
  { 
    reg: "2683198", 
    name: "ENZO VINICIOS ALMONDES DE LIMA", 
    guardian: "DAIANE DE ALMONDES DA SILVA", 
    phone: "(66) 996825014 / (66) 996053419", 
    address: "RUA DAS MARGARIDAS, 400, SETOR OESTE, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2208519", 
    name: "ESTER SANTANA RODRIGUES SANTOS", 
    guardian: "IVONE SANTANA RODRIGUES SANTOS", 
    phone: "(66) 997211840 / (66) 992804370", 
    address: "RUA DAS MARGARIDAS, 490, SETOR OESTE, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2699492", 
    name: "FELIPE GERMANO BENTO DA SILVA", 
    guardian: "KELLY CRISTINA BENTO", 
    phone: "(66) 999841360 / (66) 996322527", 
    address: "IZIDORIO MARTINS REBERT, 889, SANTA CLARA, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade D (Part 2)...");

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
