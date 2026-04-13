const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2668902", 
    name: "ENZO ARTHUR DA SILVA SANTOS", 
    guardian: "GEILZA GOMES DA SILVA", 
    phone: "(66) 999149217 / (66) 999070434", 
    address: "RUA DAS VIOLETAS, 404 B, SETOR OESTE, MARIA ANTÔNIA, COLIDER-MT" 
  },
  { 
    reg: "2723256", 
    name: "FELIPE NUNES DA SILVA", 
    guardian: "JHENIFA SIMAO DA SILVA", 
    phone: "(066) 996506436 / (066) 996343671", 
    address: "RUA AQUARELA, 939, SETOR NORTE, NOVO HORIZONTE, COLIDER-MT" 
  },
  { 
    reg: "2397899", 
    name: "FERNANDO DJARA TXUCARRAMÃE", 
    guardian: "ROITI METUKTIRE", 
    phone: "(IRM) 984454127 / (66) 999545412", 
    address: "RUA CASTRO ALVES, 344, SETOR NORTE, NOSSA SENHORA DA GUIA, COLIDER-MT" 
  },
  { 
    reg: "2302994", 
    name: "GUILHERME SOUZA ALVES", 
    guardian: "LEIA PEIXOTO DE SOUZA", 
    phone: "(66) 996427075 / (66) 997151511", 
    address: "RUA ALECRIM, 45, CELÍDIO MARQUES, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade A (Part 2)...");

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
