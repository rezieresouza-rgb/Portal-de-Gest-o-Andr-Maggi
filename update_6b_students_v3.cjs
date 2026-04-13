const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const studentsData = [
  { reg: "2269359", name: "GUILHERME CONSTANTIN DE LIMA", status: "ATIVO" },
  { reg: "2288425", name: "GABRIEL DA SILVA SOUZA", status: "ATIVO" },
  { reg: "2269364", name: "JULIANA DE SOUZA CAMPOS", status: "ATIVO" },
  { reg: "2673461", name: "BRENDA VITORIA SILVA BERTORELLO", status: "ATIVO" },
  { reg: "2673467", name: "THAEMILLI REGIELLI MARCELINO SOARES", status: "ATIVO" },
  { reg: "2669404", name: "STEFANY LAURA RODRIGUES LIMA", status: "ATIVO" },
  { reg: "2669403", name: "ISADORA NOBREGA NEGRETE GARCIA", status: "ATIVO" },
  { reg: "2669401", name: "ALISON GUILHERME RODRIGUES ARAUJO", status: "ATIVO" },
  { reg: "2669400", name: "YURI GABRIEL ALVES DE AMORIM", status: "ATIVO" },
  { reg: "2284451", name: "DANIEL ROBERT RUFINO DA COSTA", status: "ATIVO" },
  { reg: "2674267", name: "LUCAS GABRIEL DE SOUZA", status: "ATIVO" },
  { reg: "2671948", name: "EMANUEL LORENZO DO CARMO BRANCO", status: "ATIVO" },
  { reg: "2681029", name: "MARIA CLARA CARDOSO RESENDE", status: "ATIVO" },
  { reg: "2682333", name: "ENZO GONÇALVES DOS SANTOS", status: "ATIVO" },
  { reg: "2683159", name: "ANTHONY MIGUEL PEREIRA DE SOUZA", status: "ATIVO" },
  { reg: "2683745", name: "JOÃO MIGUEL MARTINS NOVAIS", status: "ATIVO" },
  { reg: "2689341", name: "LUIZ HENRIQUE SOUZA MATOS", status: "ATIVO" },
  { reg: "2230457", name: "JHENIFER PEREIRA DA SILVA SIMPLICIO", status: "ATIVO" },
  { reg: "2156760", name: "EDUARDO PEREIRA DA SILVA SIMPLICIO", status: "ATIVO" },
  { reg: "2689354", name: "VITORIA GABRIELLY DIAS", status: "ATIVO" },
  { reg: "2702574", name: "CAMILLY VITORIA BALBINO SOARES", status: "ATIVO" },
  { reg: "2321383", name: "EVERTON KAUAN DOMICIANO GONÇALVES", status: "ATIVO" },
  { reg: "2287021", name: "LAUANA LAIANNY APARECIDA ASSUNÇÃO", status: "ATIVO" },
  { reg: "2715708", name: "VINICIUS RAFAEL NOVAIS DA SILVA", status: "ATIVO" },
  { reg: "2721831", name: "NATHALY POLLYANNY LOPES DA SILVA RIBEIRO", status: "TRANSFERIDO" },
  { reg: "2699402", name: "GLENNDA GOMES DE SOUZA", status: "TRANSFERIDO" },
  { reg: "2239407", name: "BEKIRE METUKTIRE", status: "ATIVO" },
  { reg: "2724743", name: "BEPY ARETI METUKTIRE", status: "ATIVO" },
  { reg: "2725369", name: "MEREKORE TAPAYUNA METUKTIRE", status: "ATIVO" },
  { reg: "2725021", name: "DAVID LUIZ RIBEIRO DOS SANTOS", status: "ATIVO" },
  { reg: "2431373", name: "SABRINA DOS SANTOS SILVA", status: "ATIVO" }
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
    console.log("Creating 2026 Matutino 6º ANO B classroom...");
    const { data: newRoom, error: createError } = await supabase.from('classrooms')
      .insert({ name: '6º ANO B', year: '2026', shift: 'MATUTINO' })
      .select('id')
      .single();
    
    if (createError) {
      console.error("Error creating room:", createError.message);
      return;
    }
    room = newRoom;
  }

  const roomId = room.id;
  console.log(`Working with 6º ANO B room ID: ${roomId}`);

  // Need to make sure there are no other enrollments.
  console.log("Clearing old enrollments...");
  const { error: delError } = await supabase.from('enrollments').delete().eq('classroom_id', roomId);
  if (delError) {
     console.error("Error deleting old enrollments:", delError.message);
  }

  for (const s of studentsData) {
    console.log(`Processing student: ${s.name} (Reg: ${s.reg})...`);
    
    let { data: student } = await supabase.from('students')
        .select('id')
        .eq('registration_number', s.reg)
        .single();
    
    let studentId;
    if (student) {
        studentId = student.id;
        console.log(`Found existing student ID ${studentId}, updating info...`);
        const { error: updErr } = await supabase.from('students').update({
            name: s.name,
            status: s.status
        }).eq('id', studentId);
        if (updErr) console.error("Error updating student:", updErr.message);
    } else {
        console.log(`Student not found. Inserting...`);
        const { data: newS, error: sErr } = await supabase.from('students').insert({
            name: s.name,
            registration_number: s.reg,
            birth_date: '2014-01-01',
            status: s.status
        }).select('id').single();
        
        if (sErr) {
            console.error(`Error creating ${s.name}:`, sErr.message);
            continue;
        }
        studentId = newS.id;
    }

    const { error: eError } = await supabase.from('enrollments').insert({
      student_id: studentId,
      classroom_id: roomId
    });

    if (eError) console.error(`Error enrolling ${s.name}:`, eError.message);
  }

  console.log("Update complete! Total processed:", studentsData.length);
}

update6B();
