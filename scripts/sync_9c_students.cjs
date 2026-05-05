const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'e77718aa-af6c-4a4e-a243-372df483166a'; // 9º ANO C

const studentsToSync = [
  { reg: '2418807', name: 'ANA BEATRIZ SILVEIRA HESPER AZEVEDO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429791', name: 'ANA LUIZA BARBOSA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429741', name: 'ANA LUIZA SILVERIO SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429307', name: 'ANA ROSA MARISCAL CARBO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2051268', name: 'ANDRÉ DE OLIVEIRA SOUZA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2012675', name: 'ANTONIO PEDRO CAZARI DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2200705', name: 'EDUARDA RODRIGUES COSTA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2053450', name: 'EMANUELLY VITORIA MATOS SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2343081', name: 'GUSTAVO SANTOS DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429871', name: 'HELOISA KARINE SOUZA DOS SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2050838', name: 'JOÃO VITOR MENDES SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429329', name: 'JULIO SEZAR BATISTA DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2647514', name: 'KAUÊ DE ALMEIDA SOARES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429802', name: 'KEMILLY FERREIRA DOS SANTOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429335', name: 'LARISSA APARECIDA FERMIANO DE SOUZA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2287927', name: 'LEANDRO DANTAS COSTA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2185808', name: 'LEONAN MATEUS AGUIAR ARAUJO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429248', name: 'LUAN CHAGAS DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2438378', name: 'MARIA EDUARDA RODRIGUES OLIVEIRA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2438423', name: 'MILENA AGUIAR RAMOS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429808', name: 'NATHAN VINICIUS FERNANDES DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2581301', name: 'PEDRO HENRIQUE NOVAES BORGES', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2050318', name: 'SOPHIA DA SILVA MARIANO', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429277', name: 'STHEFANY DE SOUZA NICOLETI', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2430538', name: 'THALES CAUÃ DO NASCIMENTO SARDELLI', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429285', name: 'VINICIUS CORDEIRO MARTINS', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2050177', name: 'BIANCA DUARTE DA SILVA', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2007491', name: 'BEKWYIPA PANARÁ METUKTIRE', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2429316', name: 'GUSTAVO NICOLAS LIMA DAPPER', status: 'ATIVO', date: '2026-01-19' },
  { reg: '2343748', name: 'LARA VITÓRIA BARBOSA DA SILVA', status: 'TRANSFERIDO DE ESCOLA', date: '2026-02-05' },
  { reg: '2725845', name: 'MARIANA MENDES COSTA', status: 'ATIVO', date: '2026-02-09' }
];

async function sync() {
  console.log("Starting full 9º Ano C synchronization...");

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

    // 2. Ensure Enrollment in 9C
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
        console.log(`Updated enrollment status for ${s.name} in 9C`);
      }
    } else {
      await supabase.from('enrollments').insert([{
        student_id: studentId,
        classroom_id: classroomId,
        status: s.status,
        enrollment_date: s.date
      }]);
      console.log(`Enrolled ${s.name} in 9C`);
    }
  }

  console.log("Synchronization finished!");
}

sync();
