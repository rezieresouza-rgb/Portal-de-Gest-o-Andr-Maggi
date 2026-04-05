const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, registration_number, birth_date, guardian_name, contact_phone, enrollments(id, classroom_id, classrooms(name))')
    .ilike('name', '%glennda%');

  if (error) return console.error('Erro:', error.message);

  console.log('Total encontradas:', data?.length, '\n');
  data?.forEach((s, i) => {
    console.log(`--- Registro ${i+1} ---`);
    console.log('ID:', s.id);
    console.log('Matrícula:', s.registration_number);
    console.log('Nascimento:', s.birth_date);
    console.log('Responsável:', s.guardian_name || '(vazio)');
    console.log('Telefone:', s.contact_phone || '(vazio)');
    const turmaNames = s.enrollments?.map(e => e.classrooms?.name).filter(Boolean);
    console.log('Turmas:', turmaNames?.length ? turmaNames.join(', ') : 'SEM TURMA');
    console.log('');
  });
})();
