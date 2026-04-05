const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const students = [
  { id: "2235559", name: "GUILHERME CONSTANTIN DE LIMA", status: "ATIVO" },
  { id: "2235225", name: "GABRIEL DA SILVA SOUZA", status: "ATIVO" },
  { id: "2235954", name: "JULIANA DE SOUZA CAMPOS", status: "ATIVO" },
  { id: "2673411", name: "BRENDA VITORIA SILVA BERTORELLO", status: "ATIVO" },
  { id: "2673457", name: "THAEMILLI REGIELI MARCELINO SOARES", status: "ATIVO" },
  { id: "2669434", name: "STEFANY LAURA RODRIGUES LIMA", status: "ATIVO" },
  { id: "2669433", name: "ISADORA NOBREGA NEGRETE GARCIA", status: "ATIVO" },
  { id: "2669401", name: "ALISON GUILHERME RODRIGUES ARAUJO", status: "ATIVO" },
  { id: "2669430", name: "YURI GABRIEL ALVES DE AMORIM", status: "ATIVO" },
  { id: "2234451", name: "DANIEL ROBERT RUFINO DA COSTA", status: "ATIVO" },
  { id: "2674267", name: "LUCAS GABRIEL DE SOUZA", status: "ATIVO" },
  { id: "2673546", name: "EMANUEL LORENZO DO CARMO BRANCO", status: "ATIVO" },
  { id: "2631029", name: "MARIA CLARA CARDOSO REZENDE", status: "ATIVO" },
  { id: "2632333", name: "ENZO GONÇALVES DOS SANTOS", status: "ATIVO" },
  { id: "2633159", name: "ANTHONY MIQUEL PEREIRA DE SOUZA", status: "ATIVO" },
  { id: "2633745", line: "2633745", name: "JOÃO MIGUEL MARTINS NOVAIS", status: "ATIVO" },
  { id: "2633041", name: "LUIZ HENRIQUE SOUZA MATOS", status: "ATIVO" },
  { id: "2230457", name: "JHENIFER PEREIRA DA SILVA SIMPLICIO", status: "ATIVO" },
  { id: "2156760", name: "EDUARDO PEREIRA DA SILVA SIMPLICIO", status: "ATIVO" },
  { id: "2339354", name: "VITÓRIA GABRIELLY DIAS", status: "ATIVO" },
  { id: "2702574", name: "CAMILLY VITÓRIA BALBINO SOARES", status: "ATIVO" },
  { id: "2321383", name: "EWERTON KAUAN DOMICIANO GONÇALVES", status: "ATIVO" },
  { id: "2237031", name: "LAUARA LAIANNY APARECIDA ASSUNÇÃO", status: "ATIVO" },
  { id: "2715735", name: "VINICIUS RAFAEL NOVAIS DA SILVA", status: "ATIVO" },
  { id: "2721831", name: "NATHALY POLLYANE LOPES DA SILVA RIBEIRO", status: "TRANSFERIDO" },
  { id: "2699402", name: "GLENNDA GOMES DE SOUZA", status: "TRANSFERIDO" },
  { id: "2239407", name: "IREKRE METUKTIRE", status: "ATIVO" },
  { id: "2224243", name: "REPY ARET METUKTIRE", status: "ATIVO" },
  { id: "2725359", name: "MEREKORE TAPAYUNA METUKTIRE", status: "ATIVO" },
  { id: "2725001", name: "DAVID LUIZ RIBEIRO DOS SANTOS", status: "ATIVO" },
  { id: "2431373", name: "SABRINA DOS SANTOS SILVA", status: "ATIVO" }
];

async function update6B() {
  console.log("Checking classroom...");
  let { data: room } = await supabase.from('classrooms')
    .select('id')
    .eq('name', '6º ANO B')
    .eq('year', '2026')
    .eq('shift', 'MATUTINO')
    .single();

  if (!room) {
    console.log("Creating 2026 Matutino 6B classroom...");
    const { data: newRoom, error: createError } = await supabase.from('classrooms')
      .insert({ name: '6º ANO B', year: '2026', shift: 'MATUTINO' })
      .select('id')
      .single();
    
    if (createError) {
      console.error("Error creating room:", createError);
      return;
    }
    room = newRoom;
  }

  const roomId = room.id;
  console.log(`Working with 6B room ID: ${roomId}`);

  // Clear existing enrollments for consistency
  console.log("Clearing old enrollments...");
  await supabase.from('enrollments').delete().eq('classroom_id', roomId);

  for (const s of students) {
    console.log(`Processing student: ${s.name} (${s.id})...`);
    
    // UPSERT student
    const { error: sError } = await supabase.from('students').upsert({
      id: s.id,
      full_name: s.name,
      birth_date: '2014-01-01', // Default
      status: s.status
    });

    if (sError) console.error(`Error upserting ${s.name}:`, sError);

    // Create enrollment
    const { error: eError } = await supabase.from('enrollments').insert({
      student_id: s.id,
      classroom_id: roomId
    });

    if (eError) console.error(`Error enrolling ${s.name}:`, eError);
  }

  console.log("Update complete! Total processed: 31 students.");
}

update6B();
