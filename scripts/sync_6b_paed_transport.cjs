const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  // Page 1
  { name: "GUILHERME CONSTANTINI DE LIMA", newReg: "2288559", paed: true, transport: false },
  { name: "GABRIEL DA SILVA SOUZA", newReg: "2288625", paed: false, transport: false },
  { name: "JULIANA DE SOUZA CAMPOS", newReg: "2288964", paed: false, transport: false },
  { name: "BRENDA VITORIA SILVA BERTORELLO", newReg: "2673461", paed: false, transport: false },
  { name: "THAEMILLI REGIELLI MARCELINO SOARES", newReg: "2673467", paed: false, transport: false },
  { name: "STEFANY LAURA RODRIGUES LIMA", newReg: "2589404", paed: false, transport: false },
  { name: "ISADORA NOBREGA NEGRETE GARCIA", newReg: "2589403", paed: false, transport: false },
  { name: "ALISON GUILHERME RODRIGUES ARAUJO", newReg: "2589401", paed: false, transport: false },
  { name: "YURI GABRIEL ALVES DE AMORIM", newReg: "2589400", paed: false, transport: false },
  { name: "DANIEL ROBERT RUFINO DA COSTA", newReg: "2284461", paed: false, transport: false },
  { name: "LUCAS GABRIEL DE SOUZA", newReg: "2674867", paed: false, transport: false },
  { name: "EMANUEL LORENZO DO CARMO BRANCO", newReg: "2671948", paed: false, transport: false },
  { name: "MARIA CLARA CARDOSO RESENDE", newReg: "2681029", paed: false, transport: false },
  { name: "ENZO GONÇALVES DOS SANTOS", newReg: "2682303", paed: false, transport: false },
  { name: "ANTHONY MIGUEL PEREIRA DE SOUZA", newReg: "2683159", paed: false, transport: false },
  { name: "JOÃO MIGUEL MARTINS NOVAIS", newReg: "2683745", paed: false, transport: false },
  { name: "LUIZ HENRIQUE SOUZA MATOS", newReg: "2685041", paed: true, transport: false },
  { name: "JHENIFER PEREIRA DA SILVA SIMPLICIO", newReg: "2230457", paed: false, transport: false },
  { name: "EDUARDO PEREIRA DA SILVA SIMPLICIO", newReg: "2156760", paed: false, transport: false },
  { name: "VITORIA GABRIELLY DIAS", newReg: "2689354", paed: false, transport: false },
  { name: "CAMILLY VITORIA BALBINO SOARES", newReg: "2702574", paed: false, transport: false },
  { name: "EVERTON KAUAN DOMICIANO GONÇALVES", newReg: "2321383", paed: false, transport: false },
  { name: "LAUARA LAIANNY APARECIDA ASSUNÇÃO", newReg: "2287021", paed: false, transport: false },
  { name: "VINICIUS RAFAEL NOVAIS DA SILVA", newReg: "2716706", paed: false, transport: false },
  { name: "NATHALY POLLYANE LOPES DA SILVA RIBEIRO", newReg: "2721831", paed: false, transport: false },
  // Page 2
  { name: "GLENDA GOMES DE SOUZA", newReg: "2589402", paed: false, transport: false },
  { name: "BEKIRE METUKTIRE", newReg: "2239407", paed: false, transport: false },
  { name: "BEPY ARETI METUKTIRE", newReg: "2724743", paed: false, transport: false },
  { name: "MEREKORE TAPAYUNA METUKTIRE", newReg: "2725869", paed: false, transport: false },
  { name: "DAVID LUIZ RIBEIRO DOS SANTOS", newReg: "2729021", paed: false, transport: false },
  { name: "SABRINA DOS SANTOS SILVA", newReg: "2431373", paed: false, transport: false },
  { name: "MARIA EDUARDA SANTOS CERQUEIRA", newReg: "2717192", paed: false, transport: false }
];

async function sync6B() {
  console.log("Starting PAED, Transport and Registration sync for 6th Grade B...");

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

  console.log("6th Grade B sync finished.");
}

sync6B();
