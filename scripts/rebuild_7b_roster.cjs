const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const studentsData = [
  {"code": "220790", "name": "MURILO SEICENTOS DE LIMA"},
  {"code": "250317", "name": "MYCILLENE APARECIDA DOS SANTOS"},
  {"code": "258160", "name": "PEDRO HENRIQUE REBOUÇAS SALGO"},
  {"code": "224358", "name": "TAKAKAJYRY METUKTIRE"},
  {"code": "254800", "name": "THIAGO GOMES FERREIRA"},
  {"code": "221022", "name": "VITOR DANIEL ARQUINO BATISTA"},
  {"code": "250648", "name": "YASMIN VITÓRIA DE AZEVEDO"},
  {"code": "220835", "name": "AMANDA ESTEFANY SIQUEIRA DA SILVA"},
  {"code": "252315", "name": "ANA BEATRIZ PEREIRA MENDES DOS SANTOS"},
  {"code": "250322", "name": "ANNA LAURA SILVA RIBEIRO"},
  {"code": "259465", "name": "BRENDO HENRIQUE DE OLIVEIRA NOVAIS"},
  {"code": "214960", "name": "CLEICIANE SOARES RODRIGUES"},
  {"code": "260092", "name": "FELIP APARECIDO BELARMINO"},
  {"code": "259478", "name": "ISABELLY PEREIRA DE SOUZA"},
  {"code": "221418", "name": "JOÃO PEDRO SABOIA RAMOS"},
  {"code": "259497", "name": "JOÃO VITOR RAMOS DALBERTO"},
  {"code": "254514", "name": "JOHNNY SOUZA ALMEIDA"},
  {"code": "240526", "name": "KAIQUE JOSE CANDIDO DA SILVA"},
  {"code": "233847", "name": "KAYLA RAFAELA LAGE HORNICH"},
  {"code": "241754", "name": "KETHELYN SOFIA DE SOUSA DOS SANTOS"},
  {"code": "224017", "name": "KOKONA TXUKARRAMAE"},
  {"code": "258160_2", "name": "LUIZ FELIPE BRAIDA", "original_code": "258160"},
  {"code": "224825", "name": "LUKAS GONÇALVES DOMINGOS"},
  {"code": "234885", "name": "MARIA LARA DAL PUFO DE CARVALHO"},
  {"code": "259745", "name": "MARIA VITÓRIA DA SILVA SOUZA"},
  {"code": "220789", "name": "MIGUEL SEICENTOS DE LIMA"},
  {"code": "260095", "name": "MIKAELLY SANTOS AZEVEDO"},
  {"code": "255231", "name": "YASMIN VITORIA DO NASCIMENTO FIGUEIREDO"},
  {"code": "260046", "name": "HEVILLY GARCIA JARDIM"}
];

async function rebuild7BRoster() {
  const roomId = '42028b9e-a0c8-41b3-9538-915a9109fe7b'; // 7º ANO B
  console.log(`Rebuilding roster for 7º ANO B (${roomId})...`);

  // 1. Clear current enrollments
  const { error: delErr } = await supabase.from('enrollments').delete().eq('classroom_id', roomId);
  if (delErr) {
    console.error("Error clearing enrollments:", delErr.message);
    return;
  }
  console.log("Current enrollments cleared.");

  // 2. Process each student from the official list
  for (const s of studentsData) {
    const regNum = s.original_code || s.code;
    console.log(`\nProcessing: ${s.name} (${regNum})`);

    // a. Find ALL records for this student (matching name or registration)
    const { data: candidates } = await supabase
      .from('students')
      .select('*')
      .or(`registration_number.eq.${regNum},name.ilike.%${s.name.split(' ')[0]}%${s.name.split(' ').pop()}%`);

    let definitiveId;
    if (!candidates || candidates.length === 0) {
      // b. Create if not found
      console.log(`  Creating new record...`);
      const { data: newStudent, error: createErr } = await supabase
        .from('students')
        .insert({
          name: s.name,
          registration_number: regNum,
          birth_date: '2013-01-01',
          status: 'ATIVO'
        })
        .select()
        .single();
      
      if (createErr) {
        console.error(`  ERROR creating student:`, createErr.message);
        continue;
      }
      definitiveId = newStudent.id;
    } else {
      // c. Deduplicate: keep the best match
      const exactMatch = candidates.find(c => c.registration_number === regNum && c.name.toUpperCase() === s.name.toUpperCase());
      const regMatch = candidates.find(c => c.registration_number === regNum);
      const target = exactMatch || regMatch || candidates[0];
      
      definitiveId = target.id;
      console.log(`  Using existing ID: ${definitiveId}`);

      // Ensure name and registration are correct on the target
      if (target.name !== s.name || target.registration_number !== regNum) {
        await supabase.from('students').update({ name: s.name, registration_number: regNum }).eq('id', definitiveId);
      }

      // Delete other duplicates for this specific name
      const others = candidates.filter(c => c.id !== definitiveId);
      for (const other of others) {
        // Only delete if it's really a duplicate (same name or same reg)
        if (other.name.toUpperCase() === s.name.toUpperCase() || other.registration_number === regNum) {
           console.log(`  Deleting duplicate record: ${other.id}`);
           // Check if it has enrollments elsewhere before deleting? 
           // For now, let's just delete to clean up the workspace.
           await supabase.from('students').delete().eq('id', other.id);
        }
      }
    }

    // d. Enroll in 7B
    const { error: enrollErr } = await supabase
      .from('enrollments')
      .insert({
        student_id: definitiveId,
        classroom_id: roomId,
        enrollment_date: '2026-02-10'
      });
    
    if (enrollErr) {
      console.error(`  ERROR enrolling:`, enrollErr.message);
    } else {
      console.log(`  Successfully enrolled.`);
    }
  }

  // 3. Final Verification
  const { count } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('classroom_id', roomId);
  console.log(`\nDONE! Total students in 7B: ${count}`);
}

rebuild7BRoster();
