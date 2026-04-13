const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  // Page 1
  { name: "DAVY HENRIQUE BACHIEGA COSTA", newReg: "2666110", paed: false, transport: true },
  { name: "JOÃO MIGUEL JESUS ARAUJO THOME", newReg: "2666169", paed: false, transport: false },
  { name: "ADRIEL COSTA GONÇALO", newReg: "2666214", paed: false, transport: true },
  { name: "MARIANA BENICIO COSTA", newReg: "2666258", paed: false, transport: false },
  { name: "JOÃO VITOR DOS SANTOS MATEUS", newReg: "2666296", paed: false, transport: false },
  { name: "GABRIEL PLACEDINO TREVIZAN", newReg: "2666394", paed: true, transport: false },
  { name: "JEFERSON TARIFA DOS SANTOS", newReg: "2666421", paed: false, transport: false },
  { name: "SAMUEL LEANDRO DO VALE", newReg: "2666437", paed: false, transport: false },
  { name: "ARTHUR DE LIMA SANCHES", newReg: "2667251", paed: false, transport: false },
  { name: "AKEMILLY MARIA BALDAIA PAIM", newReg: "2667226", paed: false, transport: true },
  { name: "LORANE DA SILVA BEZERRA", newReg: "2287110", paed: false, transport: false },
  { name: "ALLISON VICTOR DOS SANTOS PORTO", newReg: "2286535", paed: false, transport: false },
  { name: "GABRIELI MARTINS LIMA", newReg: "2368034", paed: false, transport: true },
  { name: "TAKAKPYNEITI KABRAL METUKTIRE", newReg: "2339491", paed: false, transport: false },
  { name: "ELOIZA DE SOUZA DIAS", newReg: "2289783", paed: false, transport: false },
  { name: "YAN SILVA NUNES", newReg: "2286447", paed: false, transport: false },
  { name: "GUSTTAVO HENRIQUE DA COSTA SOUZA", newReg: "2459053", paed: false, transport: false },
  { name: "PAOLLA LIMA DA SILVA", newReg: "2289500", paed: false, transport: false },
  { name: "GABRIELLY CORREIA DOS SANTOS", newReg: "2323714", paed: false, transport: false },
  { name: "MATHEUS DE SOUZA FRANÇA", newReg: "2320081", paed: false, transport: true },
  { name: "JEAN PAULO SOARES DE OLIVEIRA", newReg: "2305802", paed: false, transport: false },
  // Page 2
  { name: "JOYCE DE JESUS DOS SANTOS", newReg: "2671389", paed: false, transport: false },
  { name: "JORGE HENRIQUE PEREIRA DE AZEVEDO", newReg: "2671365", paed: false, transport: false },
  { name: "HIAXLLEY VICTOR PAULINO BISPO", newReg: "2671289", paed: false, transport: false },
  { name: "FELIPE GERMANO BENTO DA SILVA", newReg: "2699492", paed: false, transport: false },
  { name: "HIAGO BRUNO ARAUJO DE ALMEIDA", newReg: "2709916", paed: false, transport: false },
  { name: "ESTER SANTANA RODRIGUES SANTOS", newReg: "2208519", paed: false, transport: false },
  { name: "HENRRY GABRIEL CARDOSO DORIA", newReg: "2716602", paed: false, transport: false },
  { name: "ENZO VINICIOS ALMONDES DE LIMA", newReg: "2683198", paed: false, transport: false },
  { name: "BEPI METUKTIRE", newReg: "2328692", paed: false, transport: false },
  { name: "JOZIEU MATEUS SABINO DE OLIVEIRA", newReg: "2676647", paed: true, transport: false },
  { name: "CARLOS ANDRÉ PEREIRA MIGUINS", newReg: "2732060", paed: true, transport: true }
];

async function sync6D() {
  console.log("Starting PAED, Transport and Registration sync for 6th Grade D...");

  for (const s of studentsData) {
    console.log(`Updating: ${s.name}...`);
    const { data, error } = await supabase
      .from('students')
      .update({
        registration_number: s.newReg,
        paed: s.paed,
        school_transport: s.transport
      })
      .eq('name', s.name)
      .select('name, registration_number');

    if (error) {
      console.error(`  Error updating ${s.name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`  ✓ Successfully updated: ${data[0].name} (Reg: ${data[0].registration_number})`);
    } else {
      console.warn(`  Student ${s.name} not found by name.`);
    }
  }

  console.log("6th Grade D sync finished.");
}

sync6D();
