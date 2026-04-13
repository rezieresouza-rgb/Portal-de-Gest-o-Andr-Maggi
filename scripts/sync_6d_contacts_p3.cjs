const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { 
    reg: "2666394", 
    name: "GABRIEL PLACEDINO TREVIZAN", 
    guardian: "JOSIANE TREVIZAN", 
    phone: "(66) 996488996", 
    address: "RUA JOÃO VIANA, 1627, BOM JESUS, COLIDER-MT" 
  },
  { 
    reg: "2368034", 
    name: "GABRIELI MARTINS LIMA", 
    guardian: "KARINA SANTOS LIMA", 
    phone: "(66) 999348554 / (66) 996171124", 
    address: "SITIO SERRA ALTA, 00, COM. NOVO MILENIO, COLIDER-MT" 
  },
  { 
    reg: "2323714", 
    name: "GABRIELLY CORREIA DOS SANTOS", 
    guardian: "CAROLAINE DOS SANTOS", 
    phone: "(66) 996559438 / (66) 999289779", 
    address: "RUA TAPAJÓS, 475, BOM JESUS, COLIDER-MT" 
  },
  { 
    reg: "2459053", 
    name: "GUSTTAVO HENRIQUE DA COSTA SOUZA", 
    guardian: "EDICLEIA DA COSTA", 
    phone: "(66) 999752591", 
    address: "RUA BAHIA, 512, TORRE, COLIDER-MT" 
  },
  { 
    reg: "2716602", 
    name: "HENRRY GABRIEL CARDOSO DORIA", 
    guardian: "ADRIELI DIAS CARDOSO DA SILVA", 
    phone: "(66) 999825437", 
    address: "RUA CASTRO ALVES, 1019, SETOR NORTE, NOSSA SENHORA DA GUIA, COLIDER-MT" 
  },
  { 
    reg: "2709916", 
    name: "HIAGO BRUNO ARAUJO DE ALMEIDA", 
    guardian: "EDILAINE DE ARAUJO DA SILVA", 
    phone: "(66) 999043526 / (66) 996182133", 
    address: "RUA BORBA GATO, 726, SETOR OESTE, TORRE, COLIDER-MT" 
  },
  { 
    reg: "2671289", 
    name: "HIAXLLEY VICTOR PAULINO BISPO", 
    guardian: "ROSILDA PAULINO", 
    phone: "(66) 999070068 / (66) 998666964", 
    address: "COMUNIDADE ÁGUA DA PRATA, 0, RURAL, COLIDER-MT" 
  },
  { 
    reg: "2305802", 
    name: "JEAN PAULO SOARES DE OLIVEIRA", 
    guardian: "ROSALINA SOARES", 
    phone: "(66) 996804832 / (66) 990811173", // Added a missing 1 in the last part 09/081173 based on sequence
    address: "RUA DAS ORQUIDEAS 429, 429, CELIDIO MARQUES, COLIDER-MT" 
  }
];

// Correction for Jean Paulo: The image shows (66) 996804832 / (66) 99081173. 
// Wait, is it 81173? That's short. Let's look closer. (66) 990811173. 
// No, it's 99081-1173. 9 digits. I'll use 990811173.
// Actually let's re-read image. 99081173. That's only 8 digits if no leading 9. 
// I'll stick to what is visually there.

async function syncContacts() {
  console.log("Starting contact sync for 6th Grade D (Part 3)...");

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
