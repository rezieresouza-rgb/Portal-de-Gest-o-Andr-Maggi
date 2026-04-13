const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2286436", 
    name: "GUSTAVO HENRIQUE DE PAULA DE LARA", 
    guardian: "CELSO MELO DE LARA", 
    phone: "(66) 999582003", 
    address: "RUA GIRASSOL, 335, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2668889", 
    name: "ISADORA CAETANO MATEUS", 
    guardian: "JÉSSICA CAETANO DOS SANTOS", 
    phone: "(66) 999137583 / (66) 99088093", 
    address: "AV. SÃO PAULO, 260, TORRE, COLIDER-MT" 
  },
  { 
    reg: "2304199", 
    name: "JASMIM RAFAELA AMÂNCIO DE LIMA", 
    guardian: "JANAINA AMÂNCIO DA SILVA", 
    phone: "(66) 984085966 / (66) 992325682 / (81) 992325682", 
    address: "TRAVESSA ARPOADOR, 50, SETOR SUL, BOA ESPERANÇA, COLIDER-MT" 
  },
  { 
    reg: "2668897", 
    name: "JOÃO GABRIEL DE OLIVEIRA MARTINS", 
    guardian: "JAQUELINE COELHA DE OLIVEIRA", 
    phone: "(66) 996855300 / (66) 997187661", 
    address: "TRAVESSA SOLIMOES, 26, BOA ESPERANÇA, COLIDER-MT" 
  },
  { 
    reg: "2667419", 
    name: "JOÃO LUCAS DE SOUZA DA SILVA", 
    guardian: "MARIA ELIANE DE SOUZA", 
    phone: "(65) 999406256 / (66) 996402810", 
    address: "RUA JOÃO VIANA, 1614, BOM JESUS, COLIDER-MT" 
  },
  { 
    reg: "2292207", 
    name: "JOÃO OTÁVIO GONSALVES DE LIMA", 
    guardian: "ADRIANA GONÇALVES", 
    phone: "(66) 999009215", 
    address: "RUA BAHIA, 917, ZÉ LUCIANO, COLIDER-MT" 
  },
  { 
    reg: "2286454", 
    name: "JOÃO VITOR PEREIRA DA SILVA", 
    guardian: "LUCIMAR PEREIRA SANDES", 
    phone: "(66) 996888859", 
    address: "AV. PRINCESA ISABEL, 1321, NOSSA SRA DA GUIA, COLIDER-MT" 
  },
  { 
    reg: "2667474", 
    name: "KAUAN FEITOSA MORAES", 
    guardian: "GESSIANE SOUZA FEITOSA", 
    phone: "(91) 992540921", 
    address: "RUA MATRINCHÃ, 111, TELES PIRES, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade A (Part 3)...");

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
