const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2668996", 
    name: "ANA CLARA PEREIRA BRITO", 
    guardian: "EDICLEIA BRITO PEDROSO", 
    phone: "(66) 996821859 / (66) 997109214", 
    address: "RUA DAS SAMAMBAIAS, 489, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2668972", 
    name: "BEPIET PANARA METUKTIRE", 
    guardian: "IRENG RANGA METUKTIRE", 
    phone: "(66) 996557632 / (66) 996047083", 
    address: "RUA DAS VIOLETAS, 429, CELIDIO MARQUES, COLIDER-MT" 
  },
  { 
    reg: "2669069", 
    name: "CRISLAINE VICTORIA FARIAS DE ALMEIDA", 
    guardian: "VALDEREZ FARIAS DA SILVA", 
    phone: "(66) 999585317 / (66) 984482064", 
    address: "RUA RIO BRANCO, 570, TORRE, COLIDER-MT" 
  },
  { 
    reg: "2669227", 
    name: "CRISLANE EDUARDA FARIAS DE ALMEIDA", 
    guardian: "VALDEREZ FARIAS DA SILVA", 
    phone: "(66) 999585317 / (66) 984482064", 
    address: "RUA RIO BRANCO, 570, TORRE, COLIDER-MT" 
  },
  { 
    reg: "2726402", 
    name: "DAVI CARVALHO SALMENTO", 
    guardian: "GEOVANE CARVALHO", 
    phone: "(066) 992766764 / (99) 982780616", 
    address: "RUA HORTÊNCIA, 545, SETOR OESTE, MARIA ANTONIA, COLIDER-MT" 
  },
  { 
    reg: "2667873", 
    name: "DAVI LUCAS LIMA RODRIGUES", 
    guardian: "LAURA DOS SANTOS LIMA", 
    phone: "(66) 996157002 / (66) 996007660", 
    address: "RUA JIUSEP NAVA, 1675, BOM JESUS, COLIDER-MT" 
  },
  { 
    reg: "2347759", 
    name: "EMILLY VITÓRIA GOMES DOS SANTOS", 
    guardian: "GISELE GOMES DE CARVALHO", 
    phone: "(MÃE) 999993840 / (avó) 999217371", 
    address: "RUA VERÍSSIMO CAETANO, 838, SETOR SUL, BOA ESPERANÇA, COLIDER-MT" 
  },
  { 
    reg: "2668931", 
    name: "EMILY CRISTINA DO NASCIMENTO", 
    guardian: "LEILA CRISTINA DDE ANDRADE NASCIMENTO", 
    phone: "(66) 999711126 / (66) 999573335", 
    address: "RUA GIUZEPE NAVA, 1450, BOM JESUS, COLIDER-MT" 
  }
];

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade A (Part 1)...");

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
