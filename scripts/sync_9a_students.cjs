const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '2c5e5b7d-111e-48ac-b8f8-3f1abedf7148'; // 9º ANO A

const studentsToSync = [
  { reg: '2057387', name: 'AMÁBILE CAETANO DOS SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2076441', name: 'ANA PAULA PAÇOS DE OLIVEIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2085644', name: 'ANDRIELLY CAROLINE DA SILVA PARINTINS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2050208', name: 'ANNY HELENA OLIVEIRA DOS SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2048482', name: 'DEBORA RAMOS DE OLIVEIRA', status: 'ATIVO', date: '2026-01-19', altNames: ['DÉBORA RAMOS DE OLIVEIRA'] },
  { reg: '2050308', name: 'DEIVID VIANA LEITE', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2084982', name: 'EDUARDO DA SILVA SALES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2436262', name: 'HEDUARDO MORAIS DE SOUZA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2050334', name: 'JOÃO VITOR DE OLIVEIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2436859', name: 'JOSE VITOR TRAMARIN COUTINHO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2050351', name: 'JOSIAS RODRIGUES DOS SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429328', name: 'JULIA LAÍS BRAIDA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2185682', name: 'KAUÃ VINÍCIUS SOARES ROMAN', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2050292', name: 'LUCAS CORREIA RODRIGUES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2435167', name: 'LUIZ ARTHUR DO NASCIMENTO JÁCOME', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2115842', name: 'LUIZ GUILHERME SIMÕES DE OLIVEIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429808', name: 'LUIZ HENRIQUE COSTA FERREIRA DE AZEVEDO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2057371', name: 'LUIZ HENRIQUE GOULART FERNANDES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2464918', name: 'MARIA VITÓRIA RAMOS DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2438336', name: 'MARIANE GODOY DE AQUINO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2518402', name: 'MARYANA DOMINGOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429254', name: 'MURILO PEREIRA AMARAL', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2487208', name: 'PEDRO HENRIQUE CHAGAS DA ROSA', status: 'TRANSFERIDO DE ESCOLA', date: '2026-04-01' },
  { reg: '2086810', name: 'RAFAEL DOS SANTOS LEMOS', status: 'TRANSFERIDO DE ESCOLA', date: '2026-04-02' },
  { reg: '1887428', name: 'STEFANY PEREIRA DA SILVA SIMPLICIO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2436458', name: 'VICTOR GABRIEL DIAS CARON', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2423591', name: 'YURI FAUSTINO MENDES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2085457', name: 'ANA VITORIA ALMOND DUARTE', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2074580', name: 'GUSTAVO ANGELO REBOUÇAS PASIN', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2165610', name: 'ANA JULIA RODRIGUES PEZZUTI', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2048360', name: 'CLAUDEMIR ADRIAM CALIXTO BIFI', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2050585', name: 'DOUGLAS GOMES DE BRITO', status: 'ATIVO', date: '2026-04-17' }
];

async function sync() {
  console.log("Starting full 9º Ano A synchronization...");

  for (const s of studentsToSync) {
    // 1. Find student by name (exact or altNames) or registration number
    let existingStudent = null;
    
    // Try by name
    const namesToTry = [s.name, ...(s.altNames || [])];
    for (const name of namesToTry) {
        const { data } = await supabase.from('students').select('id, name, registration_number').eq('name', name.trim()).maybeSingle();
        if (data) {
            existingStudent = data;
            break;
        }
    }
    
    // Try by registration if not found by name
    if (!existingStudent) {
        const { data } = await supabase.from('students').select('id, name, registration_number').eq('registration_number', s.reg).maybeSingle();
        if (data) {
            existingStudent = data;
        }
    }

    let studentId;
    if (existingStudent) {
      studentId = existingStudent.id;
      const updates = {};
      if (existingStudent.registration_number !== s.reg) updates.registration_number = s.reg;
      if (existingStudent.name !== s.name && !s.altNames?.includes(existingStudent.name)) {
          // Only update name if it's not one of our known variations
          updates.name = s.name;
      }
      
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

    // 2. Ensure Enrollment in 9A
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, classroom_id, status')
      .eq('student_id', studentId)
      .eq('classroom_id', classroomId) // Specifically check for THIS classroom
      .maybeSingle();

    if (existingEnrollment) {
      if (existingEnrollment.status !== s.status) {
        await supabase.from('enrollments').update({
          status: s.status,
          enrollment_date: s.date
        }).eq('id', existingEnrollment.id);
        console.log(`Updated enrollment status for ${s.name} in 9A`);
      }
    } else {
      // If not in 9A, check if in ANY other class to avoid accidentally moving
      const { data: otherEnrollment } = await supabase
        .from('enrollments')
        .select('id, classroom_id, status')
        .eq('student_id', studentId)
        .eq('status', 'ATIVO') // Only active ones might be an issue
        .maybeSingle();

      if (otherEnrollment && otherEnrollment.classroom_id !== classroomId) {
          console.log(`  Student ${s.name} is ATIVO in another class (${otherEnrollment.classroom_id}). Keeping both.`);
      }

      await supabase.from('enrollments').insert([{
        student_id: studentId,
        classroom_id: classroomId,
        status: s.status,
        enrollment_date: s.date
      }]);
      console.log(`Enrolled ${s.name} in 9A`);
    }
  }

  console.log("Synchronization finished!");
}

sync();
