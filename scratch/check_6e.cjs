const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check6E() {
  const { data: cls } = await supabase.from('classrooms').select('*').eq('name', '6º ANO E').single();
  const { data: enrollments } = await supabase.from('enrollments').select('*, student:students(*)').eq('classroom_id', cls.id);
  
  enrollments.forEach(e => {
    console.log(`Student: ${e.student?.name} | Enrollment Status: '${e.status}' | Student Status: '${e.student?.status}'`);
  });
}

check6E();
