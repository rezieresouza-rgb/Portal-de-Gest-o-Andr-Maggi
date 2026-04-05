const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function removeDupe() {
  const { data: rooms } = await supabase.from('classrooms').select('id, name').eq('name', '6º ANO A');
  console.log(`Found ${rooms.length} matching rooms.`);

  for (const r of rooms) {
    const { count: enrollments } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', r.id);
    const { count: occurrences } = await supabase.from('occurrences').select('*', { count: 'exact', head: true }).eq('classroom_id', r.id);
    const { count: plans } = await supabase.from('lesson_plans').select('*', { count: 'exact', head: true }).eq('classroom_id', r.id);
    const { count: assessments } = await supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('classroom_id', r.id);

    console.log(`Checking Room ${r.id}:`);
    console.log(`  - Enrollments: ${enrollments}`);
    console.log(`  - Occurrences: ${occurrences}`);
    console.log(`  - Lesson Plans: ${plans}`);
    console.log(`  - Assessments: ${assessments}`);

    if (enrollments === 0 && occurrences === 0 && plans === 0 && assessments === 0) {
      console.log(`BINGO! Room ${r.id} is empty and safe to delete.`);
      const { error: delErr } = await supabase.from('classrooms').delete().eq('id', r.id);
      if (delErr) {
        console.error("Error deleting room:", delErr);
      } else {
        console.log("DELETED.");
      }
    } else if (enrollments > 0) {
      console.log(`KEEPING Room ${r.id} (contains ${enrollments} students).`);
    } else {
        console.log(`Room ${r.id} is NOT empty but has 0 students. Check manually if needed.`);
    }
  }
}
removeDupe();
