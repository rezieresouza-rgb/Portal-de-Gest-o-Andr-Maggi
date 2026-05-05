const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '51adb22f-63ae-4f17-9970-edd91220ad8e'; // 8º ANO B

const studentsToSync = [
  { reg: '2235168', name: 'ALEX EMANUEL PAIXÃO SILVA', status: 'TRANSFERIDO DE ESCOLA', date: '2026-01-19' },
  { reg: '2270898', name: 'ANA CLARA FIEL BRITO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2186814', name: 'DERICK ENRIQUE GUIMARÃES AUGUSTO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2187774', name: 'EMANOEL DUARTE VIANA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2659835', name: 'FABTIELLI VITÓRIA GONÇALVES COTTEVIQUES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '1977580', name: 'FELIPE PEREIRA VIEIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2364198', name: 'FERNANDA LOPES PEREIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2136818', name: 'IZABELI SOARES CARON', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2151648', name: 'KAMILI DA SILVA SOUZA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2138684', name: 'KARLLOS MIGUEL PONCIO GOMES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2538192', name: 'KETTLYN VITÓRIA TEIXEIRA RODRIGUES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2528587', name: 'LAURA BEATRYZ JUNQUEIRA PASCOAL', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2137183', name: 'LETYCIA MARIA PAÇOS DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2137588', name: 'LUCAS ALEXSSANDRO PEREIRA DE ASSIS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2137425', name: 'LUIZ ANTONIO PINTO DE FREITAS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2623273', name: 'LUIZA EMANUELY MARQUES ALMEIDA', status: 'TRANSFERIDO DE TURMA', date: '2026-01-19' },
  { reg: '2632831', name: 'MAIKEL COUTLEM DO NASCIMENTO MENDES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2137484', name: 'MATEUS CAMARGO RODRIGUES', status: 'TRANSFERIDO DE ESCOLA', date: '2026-01-19' },
  { reg: '2137142', name: 'NATHALIA NASCIMENTO MARANHÃO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2031895', name: 'PABLO DA SILVA OLIVEIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2183584', name: 'PATRICK RYAN FERREIRA DOS SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2522483', name: 'PAULO VITHOR DE SOUZA LIMA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2534878', name: 'PEDRO MYGUELL SILVA BRITO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2138548', name: 'THALLYS NEVES DE OLIVEIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2523838', name: 'VINICIUS COSER DE JESUS', status: 'TRANSFERIDO DE ESCOLA', date: '2026-01-19' },
  { reg: '2651767', name: 'LUAN BARBOSA MOREIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2545654', name: 'MARIANA LEAL', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2519067', name: 'ARTHUR MANOEL GONÇALVES BRANCO', status: 'ATIVO', date: '2026-02-02' },
  { reg: '2412301', name: 'NATALI VITORIA NOVAIS', status: 'ATIVO', date: '2026-03-19' },
  { reg: '2200565', name: 'ÁGATA MARTINS DAMACENA', status: 'ATIVO', date: '2026-04-14' },
  { reg: '2532702', name: 'LUIZ FERNANDO ALVES DE GODOI', status: 'ATIVO', date: '2026-04-24' }
];

async function sync() {
  console.log("Starting full 8º Ano B synchronization...");

  for (const s of studentsToSync) {
    // 1. Find student by exact name or alternate names
    const namesToTry = [s.name, ...(s.altNames || [])];
    let existingStudent = null;
    
    for (const name of namesToTry) {
        const { data } = await supabase.from('students').select('id, name, registration_number').eq('name', name).maybeSingle();
        if (data) {
            existingStudent = data;
            break;
        }
    }

    let studentId;
    if (existingStudent) {
      studentId = existingStudent.id;
      const updates = {};
      if (existingStudent.registration_number !== s.reg) updates.registration_number = s.reg;
      
      if (Object.keys(updates).length > 0) {
        await supabase.from('students').update(updates).eq('id', studentId);
        console.log(`Updated ${s.name}: ${JSON.stringify(updates)}`);
      }
    } else {
      const { data: newStudent, error: createError } = await supabase.from('students').insert([{
        name: s.name,
        registration_number: s.reg,
        status: s.status.includes('TRANSFERIDO') ? 'TRANSFERIDO' : 'ATIVO',
        birth_date: '2012-01-01', // Default dummy birth date
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

    // 2. Ensure Enrollment in 8B
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
        console.log(`Updated enrollment status for ${s.name} in 8B`);
      }
    } else {
      await supabase.from('enrollments').insert([{
        student_id: studentId,
        classroom_id: classroomId,
        status: s.status,
        enrollment_date: s.date
      }]);
      console.log(`Enrolled ${s.name} in 8B`);
    }
  }

  console.log("Synchronization finished!");
}

sync();
