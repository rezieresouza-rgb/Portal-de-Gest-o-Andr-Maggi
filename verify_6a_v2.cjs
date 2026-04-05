const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function verify() {
  try {
    const { data: classroom, error: cErr } = await supabase.from('classrooms').select('id').eq('name', '6º ANO A').eq('year', '2026').single();
    if (cErr || !classroom) {
      console.error("Classroom not found:", cErr);
      return;
    }
    const { count, error: countErr } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', classroom.id);
    if (countErr) {
      console.error("Error counting enrollments:", countErr);
      return;
    }
    console.log(`Class: 6º ANO A - Total Students Enrolled: ${count}`);
    
    // Also list some names to be sure
    const { data: enrolls } = await supabase.from('enrollments').select('students(name)').eq('classroom_id', classroom.id).limit(5);
    console.log("Sample Students:", enrolls.map(e => e.students.name));
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}
verify();
