const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  // Page 1 - 25 students
  { reg: "2667280", name: "YURY LINS DOS SANTOS MOTA", paed: false, transport: false },
  { reg: "2667264", name: "MICHEL AZEVEDO PEREIRA", paed: false, transport: false },
  { reg: "2667298", name: "MIGUEL AZEVEDO PEREIRA", paed: false, transport: false },
  { reg: "2667474", name: "KAUAN FEITOSA MORAES", paed: false, transport: false },
  { reg: "2667419", name: "JOÃO LUCAS DE SOUZA DA SILVA", paed: false, transport: false },
  { reg: "2667873", name: "DAVI LUCAS LIMA RODRIGUES", paed: false, transport: false },
  { reg: "2667896", name: "WELBER LERRANDRO LOPES APARECIDO", paed: false, transport: false },
  { reg: "2667915", name: "LEONEL FELIPE OLIVEIRA DOS SANTOS", paed: true, transport: false },
  { reg: "2667952", name: "MARIA FERNANDA EQUIDONE MACHADO", paed: false, transport: false },
  { reg: "2669227", name: "CRISLANE EDUARDA FARIAS DE ALMEIDA", paed: false, transport: false },
  { reg: "2669068", name: "CRISLAINE VICTORIA FARIAS DE ALMEIDA", paed: false, transport: false },
  { reg: "2668898", name: "ANA CLARA PEREIRA BRITO", paed: false, transport: false },
  { reg: "2668872", name: "BEPIET PANARA METUKTIRE", paed: false, transport: false },
  { reg: "2668902", name: "ENZO ARTHUR DA SILVA SANTOS", paed: true, transport: false },
  { reg: "2668931", name: "EMILY CRISTINA DO NASCIMENTO", paed: false, transport: false },
  { reg: "2668909", name: "SABRINA VITORIA MATIAS MARTINS", paed: false, transport: false },
  { reg: "2668897", name: "JOÃO GABRIEL DE OLIVEIRA MARTINS", paed: false, transport: false },
  { reg: "2668889", name: "ISADORA CAETANO MATEUS", paed: false, transport: false },
  { reg: "2670313", name: "MISAEL LUIZ DA SILVA DIAS", paed: false, transport: false },
  { reg: "2286454", name: "JOÃO VITOR PEREIRA DA SILVA", paed: false, transport: false },
  { reg: "2286438", name: "GUSTAVO HENRIQUE DE PAULA DE LARA", paed: false, transport: false },
  { reg: "2292207", name: "JOÃO OTÁVIO GONSALVES DE LIMA", paed: false, transport: false },
  { reg: "2302834", name: "GUILHERME SOUZA ALVES", paed: false, transport: false },
  { reg: "2287215", name: "PAULA FERNANDA COIMBRA DA SILVA", paed: false, transport: false },
  { reg: "2325564", name: "MIKAELY TIBURCIO SILVA", paed: false, transport: false }
];

async function syncPaedTransport() {
  console.log("Starting PAED and Transport sync for 6th Grade A...");

  for (const s of studentsData) {
    console.log(`Updating: ${s.name}...`);
    const { data, error } = await supabase
      .from('students')
      .update({
        paed: s.paed,
        school_transport: s.transport
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

  console.log("PAED and Transport sync finished (Page 1).");
}

syncPaedTransport();
