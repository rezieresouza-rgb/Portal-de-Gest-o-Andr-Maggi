const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2666214", 
    name: "ADRIEL COSTA GONÇALO", 
    guardian: "NADJA COSMO COSTA", 
    phone: "(66) 999898984 / (66) 996700095", 
    address: "ESTRADA SÃO JOÃO, AA, COMUNIDADE ÁGUA LIMPA, COLIDER-MT" 
  },
  { 
    reg: "2667226", 
    name: "AKEMILLY MARIA BALDAIA PAIM", 
    guardian: "CLEOMAR GONÇALVES PAIM", 
    phone: "(66) 996820954 / (66) 999109119", 
    address: "FAZENDA BELA VISTA, 000, COMUNIDADE NOVO MILENIUM, COLIDER-MT" 
  },
  { 
    reg: "2286535", 
    name: "ALLISON VICTOR DOS SANTOS PORTO", 
    guardian: "ADENILZA DOS SANTOS SILVA", 
    phone: "(66) 996182188 / (66) 996844964", 
    address: "RUA IPIRANGA, 1374, NOSSA SENHORA DA GUIA, COLIDER-MT" 
  },
  { 
    reg: "2667251", 
    name: "ARTHUR DE LIMA SANCHES", 
    guardian: "LEANDRO FABIANO SANCHES", 
    phone: "(66) 997145566 / (66) 992225592", 
    address: "RUA JURUPOCA, 292, TELES PIRES, COLIDER-MT" 
  },
  { 
    reg: "2328692", 
    name: "BEPI METUKTIRE", 
    guardian: "NANGRA TAPAYUNA", 
    phone: "(66) 999037543 / (66) 992818837", 
    address: "AVENIDA TANCREDO NEVES, 251, CENTRO, COLIDER-MT" 
  },
  { 
    reg: "2732060", 
    name: "CARLOS ANDRÉ PEREIRA MIGUINS", 
    guardian: "FRANSCISCA DA CONCEIÇÃO PEREIRA", 
    phone: "(66) 996236245", 
    address: "ESTRADA JACUTINGA, 00, FAZENDINHA DA VÓ, RURAL, COLIDER-MT" 
  },
  { 
    reg: "2666110", 
    name: "DAVY HENRIQUE BACHIEGA COSTA", 
    guardian: "EDER APARECIDO DA COSTA", 
    phone: "(66) 996328060 / (66) 996853887", 
    address: "COMUNIDADE NOSSA SRA DE LOURDES, 00, ESTÁNCIA SANTA MARIA, RURAL, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade D (Part 1)...");

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
