const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2671365", 
    name: "JORGE HENRIQUE PEREIRA DE AZEVEDO", 
    guardian: "MARIA ELIZA RODRIGUES", 
    phone: "(66) 999776029 / (66) 996186408", 
    address: "CONFINAMENTO ABACAXI QUEBRADO, 0, RURAL, COLIDER-MT" 
  },
  { 
    reg: "2671389", 
    name: "JOYCE DE JESUS DOS SANTOS", 
    guardian: "MONICA DOS SANTOS DE JESUS", 
    phone: "(66) 997253482 / (66) 984398565", 
    address: "RUA M, 42, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2676647", 
    name: "JOZIEU MATEUS SABINO DE OLIVEIRA", 
    guardian: "MARCIANA SABINO", 
    phone: "(66) 981331973 / (66) 996479756", 
    address: "AVENIDA TIRADENTES, 1007, SETOR OESTE, BOM JESUS, COLIDER-MT" 
  },
  { 
    reg: "2287110", 
    name: "LORANE DA SILVA BEZERRA", 
    guardian: "ELIZABETE DA SILVA LUIZ", 
    phone: "(66) 999519364 / (66) 996559437", 
    address: "RUA SAMAMBAIA, 549, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2666258", 
    name: "MARIANA BENICIO COSTA", 
    guardian: "ADILANI COSTA BATISTA", 
    phone: "(66) 996965783 / (66) 996717762", 
    address: "AV TIRADENTES, 1185, BOM JESUS, COLIDER-MT" 
  },
  { 
    reg: "2320081", 
    name: "MATHEUS DE SOUZA FRANÇA", 
    guardian: "ELIZETH GARCIA DE SOUZA", 
    phone: "(66) 996301483 / (66) 999415951", 
    address: "RUA BELOS CAMPOS, 00, BELA, NÃO TEM, COLIDER-MT" 
  },
  { 
    reg: "2289500", 
    name: "PAOLLA LIMA DA SILVA", 
    guardian: "GESSICA DE LARA LIMA", 
    phone: "(66) 999437448 / (66) 999344730", 
    address: "RUA DAS FLORES, 000, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2666437", 
    name: "SAMUEL LEANDRO DO VALE", 
    guardian: "ALESSANDRA LEANDRO DA SILVA", 
    phone: "(66) 996339123 / (66) 999468436", 
    address: "RUA VERÍSSIMO CAETANO, 1720, SAGRADA FAMÍLIA, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade D (Part 5)...");

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
