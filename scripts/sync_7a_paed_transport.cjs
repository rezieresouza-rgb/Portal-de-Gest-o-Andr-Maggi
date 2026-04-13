const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '332b3668-2df0-4041-82fd-0ad1d3275260';

// In this classroom (7A), only Gabriel Henrike Duarte is PAED (SIM), 
// and NO students are using school transport for now according to the report.
const flagsData = [
  { reg: "2580648", paed: false, transport: false },
  { reg: "2600523", paed: false, transport: false },
  { reg: "2213860", paed: false, transport: false },
  { reg: "2596401", paed: false, transport: false },
  { reg: "2600770", paed: false, transport: false },
  { reg: "2600785", paed: false, transport: false },
  { reg: "2604263", paed: false, transport: false },
  { reg: "2198238", paed: false, transport: false },
  { reg: "2651735", paed: false, transport: false },
  { reg: "2595180", paed: false, transport: false },
  { reg: "2649923", paed: false, transport: false },
  { reg: "2231709", paed: false, transport: false },
  { reg: "2223181", paed: false, transport: false },
  { reg: "2208540", paed: false, transport: false },
  { reg: "2588048", paed: false, transport: false },
  { reg: "2596515", paed: false, transport: false },
  { reg: "2626709", paed: false, transport: false },
  { reg: "2651633", paed: false, transport: false },
  { reg: "2599606", paed: false, transport: false },
  { reg: "2596783", paed: true, transport: false }, // Gabriel Henrike Duarte
  { reg: "2595083", paed: false, transport: false },
  { reg: "2587899", paed: false, transport: false },
  { reg: "2651630", paed: false, transport: false },
  { reg: "2231294", paed: false, transport: false },
  { reg: "2405507", paed: false, transport: false },
  { reg: "2208914", paed: false, transport: false },
  { reg: "2596601", paed: false, transport: false },
  { reg: "2246470", paed: false, transport: false },
  { reg: "2596196", paed: false, transport: false },
  { reg: "2599033", paed: false, transport: false }
];

async function syncFlags() {
  console.log('--- ATUALIZANDO PAED E TRANSPORTE 7\u00ba ANO A ---');
  let count = 0;

  for (const item of flagsData) {
    const { error: studentErr } = await supabase
      .from('students')
      .update({
        paed: item.paed,
        school_transport: item.transport
      })
      .eq('registration_number', item.reg);

    if (studentErr) {
      console.error(`\u274c Erro no aluno ${item.reg}:`, studentErr.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  console.log(`\n\u2705 Sucesso: ${count} alunos atualizados.`);
}

syncFlags();
