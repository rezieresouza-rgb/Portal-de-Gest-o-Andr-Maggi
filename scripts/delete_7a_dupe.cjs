const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function deleteDupe() {
  const deleteId = '332b3668-2df0-404c-880d-85675e4787a7';
  console.log(`Starting deletion of duplicated classroom ID: ${deleteId}`);

  // 1. Delete Enrollments
  console.log("Deleting enrollments for the duplicate class...");
  const { error: enrollError } = await supabase
    .from('enrollments')
    .delete()
    .eq('classroom_id', deleteId);

  if (enrollError) {
    console.error("Error deleting enrollments:", enrollError.message);
    return;
  }

  // 2. Delete Classroom
  console.log("Deleting classroom record...");
  const { error: classError } = await supabase
    .from('classrooms')
    .delete()
    .eq('id', deleteId);

  if (classError) {
    console.error("Error deleting classroom:", classError.message);
    return;
  }

  console.log("DELETION COMPLETED SUCCESSFULLY!");

  // 3. Final Verification
  const { data: rooms, error: checkErr } = await supabase
    .from('classrooms')
    .select('id, name, year')
    .eq('name', '7º ANO A')
    .eq('year', '2026');

  if (checkErr) console.error("Error checking final classrooms:", checkErr);
  else {
    console.log(`Final count of "7º ANO A" for 2026: ${rooms.length}`);
    for (const r of rooms) {
      const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', r.id);
      console.log(`Remaining Class ID: ${r.id} | Students: ${count}`);
    }
  }
}

deleteDupe();
