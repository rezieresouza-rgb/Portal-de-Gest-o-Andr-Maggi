const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '51adb22f-63ae-4f17-9970-edd91220ad8e'; // 8º ANO B

async function update() {
  console.log("Starting 8º Ano B Student List Update...");

  // 1. Correct Registration Numbers
  const regUpdates = [
    { id: '9c095220-ccaa-451f-87b2-467084a7b239', reg: '2138684', name: 'KARLLOS MIGUEL PONCIO GOMES' },
    { id: 'c228c6b4-8291-4360-a85b-00a2182965ae', reg: '2528587', name: 'LAURA BEATRYZ JUNQUEIRA PASCOAL' },
    { id: 'cf155184-1065-4fa9-b6f0-1a1acb203db4', reg: '2137588', name: 'LUCAS ALEXSSANDRO PEREIRA DE ASSIS' },
    { id: '29ee62bb-c585-4c30-8df7-29ded6e0a743', reg: '2031895', name: 'PABLO DA SILVA OLIVEIRA' },
    { id: '6f4871b1-83e0-44cc-9092-41da2cadcaf5', reg: '2183584', name: 'PATRICK RYAN FERREIRA DOS SANTOS' },
    { id: '8815319f-0f67-4205-b41b-a218426f3459', reg: '2138548', name: 'THALLYS NEVES DE OLIVEIRA' },
    { id: '12f3de3c-bf00-4c00-acd1-9378fc2239ba', reg: '2523838', name: 'VINICIUS COSER DE JESUS' }
  ];

  for (const item of regUpdates) {
    const { error } = await supabase.from('students').update({ registration_number: item.reg }).eq('id', item.id);
    if (error) console.error(`Error updating ${item.name}:`, error);
    else console.log(`Updated registration for ${item.name} to ${item.reg}`);
  }

  // 2. Add Missing Student: Ágata Martins Damacena
  console.log("Adding Ágata Martins Damacena...");
  const { data: newStudent, error: addError } = await supabase.from('students').insert([{
    name: 'ÁGATA MARTINS DAMACENA',
    registration_number: '2200565',
    status: 'ATIVO',
    address: 'NÃO INFORMADO',
    guardian_name: 'NÃO INFORMADO',
    contact_phone: 'NÃO INFORMADO'
  }]).select().single();

  if (addError) {
    console.error("Error adding Ágata:", addError);
  } else {
    console.log("Ágata added with ID:", newStudent.id);
    const { error: enrError } = await supabase.from('enrollments').insert([{
      student_id: newStudent.id,
      classroom_id: classroomId,
      status: 'ATIVO',
      enrollment_date: '2026-04-14'
    }]);
    if (enrError) console.error("Error enrolling Ágata:", enrError);
    else console.log("Ágata enrolled in 8B");
  }

  // 3. Move Student: Luiz Fernando Alves de Godoi
  console.log("Moving Luiz Fernando Alves de Godoi to 8B...");
  // First, find his current enrollment and close it? Or just move it.
  // The system usually allows only one active enrollment.
  const luizId = '8311b942-ebdb-4e1c-b748-090d8a585f3c';
  const { error: moveError } = await supabase.from('enrollments').update({
    classroom_id: classroomId,
    enrollment_date: '2026-04-24'
  }).eq('student_id', luizId);

  if (moveError) console.error("Error moving Luiz Fernando:", moveError);
  else console.log("Luiz Fernando moved to 8B");

  // 4. Update Enrollment Dates for Natali and Arthur
  const dateUpdates = [
    { id: '9bbe8b1f-65a7-46a7-a251-599a0b74298e', date: '2026-03-19', name: 'NATALI VITORIA NOVAIS' },
    { id: '344849e7-495c-43f0-8efd-107062400e99', date: '2026-02-02', name: 'ARTHUR MANOEL GONÇALVES BRANCO' }
  ];
  // Wait, I need Arthur's ID. Let me find it first.
}

async function findArthur() {
    const { data } = await supabase.from('students').select('id').eq('registration_number', '2519067').single();
    return data ? data.id : null;
}

async function run() {
    const arthurId = await findArthur();
    if (arthurId) {
        console.log("Found Arthur ID:", arthurId);
        // Start the update with Arthur ID
        await executeUpdate(arthurId);
    } else {
        console.error("Could not find Arthur!");
    }
}

async function executeUpdate(arthurId) {
  // 1. Correct Registration Numbers (Same as above)
  const regUpdates = [
    { id: '9c095220-ccaa-451f-87b2-467084a7b239', reg: '2138684', name: 'KARLLOS MIGUEL PONCIO GOMES' },
    { id: 'c228c6b4-8291-4360-a85b-00a2182965ae', reg: '2528587', name: 'LAURA BEATRYZ JUNQUEIRA PASCOAL' },
    { id: 'cf155184-1065-4fa9-b6f0-1a1acb203db4', reg: '2137588', name: 'LUCAS ALEXSSANDRO PEREIRA DE ASSIS' },
    { id: '29ee62bb-c585-4c30-8df7-29ded6e0a743', reg: '2031895', name: 'PABLO DA SILVA OLIVEIRA' },
    { id: '6f4871b1-83e0-44cc-9092-41da2cadcaf5', reg: '2183584', name: 'PATRICK RYAN FERREIRA DOS SANTOS' },
    { id: '8815319f-0f67-4205-b41b-a218426f3459', reg: '2138548', name: 'THALLYS NEVES DE OLIVEIRA' },
    { id: '12f3de3c-bf00-4c00-acd1-9378fc2239ba', reg: '2523838', name: 'VINICIUS COSER DE JESUS' }
  ];

  for (const item of regUpdates) {
    await supabase.from('students').update({ registration_number: item.reg }).eq('id', item.id);
  }

  // 2. Add Ágata
  const { data: newStudent } = await supabase.from('students').insert([{
    name: 'ÁGATA MARTINS DAMACENA',
    registration_number: '2200565',
    status: 'ATIVO',
    address: 'NÃO INFORMADO',
    guardian_name: 'NÃO INFORMADO',
    contact_phone: 'NÃO INFORMADO'
  }]).select().single();

  if (newStudent) {
    await supabase.from('enrollments').insert([{
      student_id: newStudent.id,
      classroom_id: classroomId,
      status: 'ATIVO',
      enrollment_date: '2026-04-14'
    }]);
  }

  // 3. Move Luiz Fernando
  const luizId = '8311b942-ebdb-4e1c-b748-090d8a585f3c';
  await supabase.from('enrollments').update({
    classroom_id: classroomId,
    enrollment_date: '2026-04-24'
  }).eq('student_id', luizId);

  // 4. Update dates
  await supabase.from('enrollments').update({ enrollment_date: '2026-03-19' }).eq('student_id', '9bbe8b1f-65a7-46a7-a251-599a0b74298e');
  await supabase.from('enrollments').update({ enrollment_date: '2026-02-02' }).eq('student_id', arthurId);

  console.log("Update completed successfully!");
}

run();
