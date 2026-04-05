const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  // Buscar os dois registros
  const { data } = await supabase
    .from('students')
    .select('id, name, registration_number, birth_date, contact_phone, enrollments(id, classroom_id, classrooms(name))')
    .ilike('name', '%glennda%');

  if (!data || data.length < 2) {
    console.log('Encontrados:', data?.length, 'registros. Nada a fazer.');
    data?.forEach(r => console.log(' -', r.registration_number, r.birth_date, r.enrollments?.map(e=>e.classrooms?.name)));
    return;
  }

  // Identificar: placeholder tem nasc=2014-01-01, real tem data diferente
  const placeholder = data.find(r => r.birth_date === '2014-01-01');
  const real = data.find(r => r.birth_date !== '2014-01-01');

  if (!placeholder || !real) {
    console.log('Não consegui identificar placeholder vs real. Dados:');
    data.forEach(r => console.log(' -', r.id, r.registration_number, r.birth_date));
    return;
  }

  console.log('PLACEHOLDER:', placeholder.registration_number, placeholder.birth_date, '-- turma:', placeholder.enrollments?.map(e=>e.classrooms?.name));
  console.log('REAL:', real.registration_number, real.birth_date, '-- turma:', real.enrollments?.map(e=>e.classrooms?.name));

  // Pegar a turma do placeholder
  const placeholderEnrollment = placeholder.enrollments?.[0];
  const targetClassroomId = placeholderEnrollment?.classroom_id;
  const targetClassName = placeholderEnrollment?.classrooms?.name;

  console.log('\nPasso 1: Remover enrollment do placeholder...');
  if (placeholderEnrollment) {
    const { error } = await supabase.from('enrollments').delete().eq('id', placeholderEnrollment.id);
    if (error) console.error('Erro deletar enrollment placeholder:', error.message);
    else console.log('  OK - enrollment do placeholder removido.');
  }

  console.log('Passo 2: Deletar aluno placeholder...');
  const { error: delErr } = await supabase.from('students').delete().eq('id', placeholder.id);
  if (delErr) console.error('Erro deletar placeholder:', delErr.message);
  else console.log('  OK - aluno placeholder deletado.');

  // Verificar se o aluno real já tem enrollment
  const realEnrollment = real.enrollments?.[0];
  if (!realEnrollment && targetClassroomId) {
    console.log('Passo 3: Matricular aluno real na turma', targetClassName, '...');
    const { error } = await supabase.from('enrollments').insert([{
      student_id: real.id,
      classroom_id: targetClassroomId,
      enrollment_date: new Date().toLocaleDateString('sv-SE')
    }]);
    if (error) console.error('Erro ao matricular:', error.message);
    else console.log('  OK - aluno real matriculado em', targetClassName);
  } else if (realEnrollment) {
    console.log('Passo 3: Aluno real já tem turma:', real.enrollments?.map(e=>e.classrooms?.name));
    // Se a turma é diferente, mover
    if (realEnrollment.classroom_id !== targetClassroomId && targetClassroomId) {
      const { error } = await supabase.from('enrollments').update({ classroom_id: targetClassroomId }).eq('id', realEnrollment.id);
      if (error) console.error('Erro ao mover turma:', error.message);
      else console.log('  OK - movido para', targetClassName);
    }
  }

  console.log('\n✅ Mesclagem concluída! Glennda agora tem apenas 1 registro.');
})().catch(e => console.error('Erro fatal:', e.message));
