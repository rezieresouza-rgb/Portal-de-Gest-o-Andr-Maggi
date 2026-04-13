const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2667915", 
    name: "LEONEL FELIPE OLIVEIRA DOS SANTOS", 
    guardian: "VALÉRIA OLIVEIRA MARINHO", 
    phone: "(66) 84039274 / (66) 996429101", 
    address: "RUA BAHIA, 499, SETOR NORTE, NOSSA SRA DA GUIA, COLIDER-MT" 
  },
  { 
    reg: "2667952", 
    name: "MARIA FERNANDA EQUIDONE MACHADO", 
    guardian: "ALEXANDRE JUNIOR MACHADO", 
    phone: "(66) 999919790 / (66) 996407969", 
    address: "RUA NAYRAM, 1377, MRADA DO SOL, COLIDER-MT" 
  },
  { 
    reg: "2667264", 
    name: "MICHEL AZEVEDO PEREIRA", 
    guardian: "MARCILENE AZEVEDO DE SOUZA", 
    phone: "(66) 999528896 / (66) 999365942", 
    address: "RUA DAS ÁLIAS, 397, CELIDIO MARQUES, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade A (Part 4)...");

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
