
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: classroom, error: classError } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('name', '9º ANO E')
      .single();

    if (classError) throw classError;

    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        students (
          name,
          registration_number
        )
      `)
      .eq('classroom_id', classroom.id);

    if (enrollError) throw enrollError;

    console.log(`Alunos vinculados ao ID ${classroom.id} (${classroom.name}):`);
    enrollments.forEach((e, idx) => {
      console.log(`${idx + 1}. ${e.students?.name} (${e.students?.registration_number})`);
    });
    console.log(`Total: ${enrollments.length}`);

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
