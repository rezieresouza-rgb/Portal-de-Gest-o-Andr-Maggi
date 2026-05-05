const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'c4151923-5eba-4ef9-a989-a0d8e66658c5'; // 9º ANO B

const studentsToSync = [
  { reg: '2429796', name: 'ANNA JULYA DA SILVA MARTINS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2366300', name: 'ANNE BEATRIZ TELES DE ANACLETO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2048512', name: 'ANTONY DAVI DA COSTA FREITAS', status: 'TRANSFERIDO DE ESCOLA', date: '2026-03-10' },
  { reg: '2117028', name: 'ANTONY HENRIQUE ARQUINO DE CAMPOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2068947', name: 'BRUNO DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2048587', name: 'EDUARDO GABRIEL DE SOUZA PACHIGUA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2537652', name: 'GUILHERME HENRIQUE NOBREGA NEGRETE GARCIA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2264395', name: 'HEITOR CASSIANO BRAGA RODRIGUES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2464809', name: 'HENRIQUE CESAR PEREIRA DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2247164', name: 'IGOR DE JESUS DE SOUZA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2542824', name: 'INGRID GABRIELY SOUZA MATOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429322', name: 'JHOYCE DOS SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2439166', name: 'JOAO VICTOR TEODORO DAPPER BALIERO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2436226', name: 'KAMILLY VITORIA SILVA DIAS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2048505', name: 'KENEDY ALVES DOS SANTOS PEREIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2436109', name: 'LARISSA LEITE BISPO DOS SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2048909', name: 'LUDYMILA LIMA BRITO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2554939', name: 'MAIKELLY RODRIGUES DE OLIVEIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429816', name: 'RENATO DOS SANTOS SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2374146', name: 'SILVANO JUNIOR FERREIRA DE AZEVEDO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2490594', name: 'STHEPHANIE CIBELE MARTINS DOS SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '1977407', name: 'TIAGO SABOIA RAMOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2457076', name: 'YASMIN VITÓRIA DE OLIVEIRA ARAÚJO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2050911', name: 'EDUARDA DOS ANJOS MATEUS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2566965', name: 'NICOLE AHITANA PENALOZA ACEVEDO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2044100', name: 'JOÃO PEDRO INACIO DE OLIVEIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2203148', name: 'YASMIN RAFAELA AMÂNCIO DE LIMA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2048392', name: 'ANA BEATRIZ DA SILVA GONÇALVES PESSOA', status: 'ATIVO', date: '2026-02-02' },
  { reg: '2472665', name: 'IZABELY CRISTINI DA SILVA MARINHO', status: 'ATIVO', date: '2026-02-02' },
  { reg: '2069781', name: 'KAUAN RAFAEL NUNES DA SILVA', status: 'ATIVO', date: '2026-04-17' }
];

async function sync() {
  console.log("Starting full 9º Ano B synchronization...");

  for (const s of studentsToSync) {
    // 1. Find student by name
    let existingStudent = null;
    const { data } = await supabase.from('students').select('id, name, registration_number').eq('name', s.name.trim()).maybeSingle();
    if (data) {
        existingStudent = data;
    } else {
        const { data: byReg } = await supabase.from('students').select('id, name, registration_number').eq('registration_number', s.reg).maybeSingle();
        if (byReg) existingStudent = byReg;
    }

    let studentId;
    if (existingStudent) {
      studentId = existingStudent.id;
      const updates = {};
      if (existingStudent.registration_number !== s.reg) updates.registration_number = s.reg;
      if (existingStudent.name !== s.name) updates.name = s.name;
      
      if (Object.keys(updates).length > 0) {
        await supabase.from('students').update(updates).eq('id', studentId);
        console.log(`Updated ${s.name}: ${JSON.stringify(updates)}`);
      }
    } else {
      const { data: newStudent, error: createError } = await supabase.from('students').insert([{
        name: s.name,
        registration_number: s.reg,
        status: s.status.includes('TRANSFERIDO') ? 'TRANSFERIDO' : 'ATIVO',
        birth_date: '2011-01-01',
        address: 'NÃO INFORMADO',
        guardian_name: 'NÃO INFORMADO',
        contact_phone: 'NÃO INFORMADO'
      }]).select().single();

      if (createError) {
        console.error(`Error creating ${s.name}:`, createError);
        continue;
      }
      studentId = newStudent.id;
      console.log(`Created ${s.name}`);
    }

    // 2. Ensure Enrollment in 9B
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, classroom_id, status')
      .eq('student_id', studentId)
      .eq('classroom_id', classroomId)
      .maybeSingle();

    if (existingEnrollment) {
      if (existingEnrollment.status !== s.status) {
        await supabase.from('enrollments').update({
          status: s.status,
          enrollment_date: s.date
        }).eq('id', existingEnrollment.id);
        console.log(`Updated enrollment status for ${s.name} in 9B`);
      }
    } else {
      await supabase.from('enrollments').insert([{
        student_id: studentId,
        classroom_id: classroomId,
        status: s.status,
        enrollment_date: s.date
      }]);
      console.log(`Enrolled ${s.name} in 9B`);
    }
  }

  console.log("Synchronization finished!");
}

sync();
