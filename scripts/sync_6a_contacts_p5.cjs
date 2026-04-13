const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2667299", 
    name: "MIGUEL AZEVEDO PEREIRA", 
    guardian: "MARCILENE AZEVEDO DE SOUZA", 
    phone: "(66) 999528896 / (66) 999365942", 
    address: "RUA DÁLIA, 397, MARIA ANTÔNIA, COLIDER-MT" 
  },
  { 
    reg: "2325694", 
    name: "MIKAELY TIBURCIO SILVA", 
    guardian: "VANDERLEIA TIBURCIO COREA", 
    phone: "(66) 999728772", 
    address: "RUA DAS ROSAS, 310, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2670913", 
    name: "MISAEL LUIZ DA SILVA DIAS", 
    guardian: "ROSIELE CARDOSO DA SILVA DIAS", 
    phone: "(66) 996579830 / (66) 992552516", 
    address: "RUA TAPAJÓS, 1606, BOM JESUS, COLIDER-MT" 
  },
  { 
    reg: "2287215", 
    name: "PAULA FERNANDA COIMBRA DA SILVA", 
    guardian: "MARIA APARECIDA COIMBRA DA SILVA", 
    phone: "(66) 996733924 / (66) 997183998", 
    address: "RUA CASTRO ALVES, 904, NOSSA SRA DA GUIA, COLIDER-MT" 
  },
  { 
    reg: "2668909", 
    name: "SABRINA VITORIA MATIAS MARTINS", 
    guardian: "GILVANI MATIAS DOS SANTOS MARTINS", 
    phone: "(66) 992551740 / (66) 992173678", 
    address: "ESTRADA CARAPÁ, 00000, ZONA RURAL, COLIDER-MT" 
  },
  { 
    reg: "2667896", 
    name: "WELBER LERRANDRO LOPES APARECIDO", 
    guardian: "CLAUDINEIA LOPES VIEIRA APARECIDA", 
    phone: "(66) 996109571 / (66) 996804985", 
    address: "RUA DAS MARGARIDAS, 505, MARIA ANTÔNIA, COLIDER-MT" 
  },
  { 
    reg: "2667280", 
    name: "YURY LINS DOS SANTOS MOTA", 
    guardian: "ROZILENE APARECIDA DA MOTA", 
    phone: "(66) 999049122 / (66) 999711934", 
    address: "RUA DAS AVENCAS, 324, CELIDIO MARQUES, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade A (Part 5 - Final)...");

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
