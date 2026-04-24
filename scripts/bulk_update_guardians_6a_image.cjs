const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const updates = [
  {
    registration_number: "2668897",
    name: "JOÃO GABRIEL DE OLIVEIRA MARTINS",
    address: "TRAVESSA SOLIMOES, 26, BOA ESPERANÇA, COLIDER-MT",
    guardian_name: "JAQUELINE COELHA DE OLIVEIRA",
    contact_phone: "(66) 996555300 / (66) 997187661"
  },
  {
    registration_number: "2667419",
    name: "JOÃO LUCAS DE SOUZA DA SILVA",
    address: "RUA JOÃO VIANA, 1614, BOM JESUS, COLIDER-MT",
    guardian_name: "MARIA ELIANE DE SOUZA",
    contact_phone: "(66) 999408256 / (66) 996402810"
  },
  {
    registration_number: "2292207",
    name: "JOÃO OTÁVIO GONSALVES DE LIMA",
    address: "RUA BAHIA, 917, SETOR OESTE, ZÉ LUCIANO, COLIDER-MT",
    guardian_name: "ADRIANA GONÇALVES",
    contact_phone: "(66) 999009215"
  },
  {
    registration_number: "2286454",
    name: "JOÃO VITOR PEREIRA DA SILVA",
    address: "AV. PRINCESA ISABEL, 1321, NOSSA SRA DA GUIA, COLIDER-MT",
    guardian_name: "LUCIMAR PEREIRA SANDES",
    contact_phone: "(66) 996888859"
  },
  {
    registration_number: "2667474",
    name: "KAUAN FEITOSA MORAES",
    address: "RUA MATRINCHÃ, 111, SETOR NORTE, TELES PIRES, COLIDER-MT",
    guardian_name: "GESSIANE SOUZA FEITOSA",
    contact_phone: "(91) 992840921"
  },
  {
    registration_number: "2667915",
    name: "LEONEL FELIPE OLIVEIRA DOS SANTOS",
    address: "RUA BAHIA, 499, SETOR NORTE, NOSSA SRA DA GUIA, COLIDER-MT",
    guardian_name: "HELENA OLIVEIRA MARINHO",
    contact_phone: "(66) 84039274 / (66) 996429101"
  }
];

async function bulkUpdate() {
  console.log("Iniciando atualização em massa dos responsáveis e endereços...");
  
  for (const u of updates) {
    console.log(`Atualizando: ${u.name}...`);
    const { error } = await supabase
      .from('students')
      .update({
        address: u.address,
        guardian_name: u.guardian_name,
        contact_phone: u.contact_phone
      })
      .eq('registration_number', u.registration_number);

    if (error) {
      console.error(`Erro ao atualizar ${u.name}:`, error.message);
    } else {
      console.log(`✓ ${u.name} atualizado.`);
    }
  }
  
  console.log("Atualização concluída!");
}

bulkUpdate();
