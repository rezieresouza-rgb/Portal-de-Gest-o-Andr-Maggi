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

async function deleteFinalDupe() {
  const deleteId = 'f308d078-c267-4013-b27d-351352f34396';
  console.log(`Starting final cleanup of duplicated classroom ID: ${deleteId}`);

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

  console.log("FINAL DELETION COMPLETED SUCCESSFULLY!");

  // 3. Final Verification
  console.log("Verifying remaining rooms...");
  const { data: rooms, error: checkErr } = await supabase
    .from('classrooms')
    .select('id, name, year')
    .ilike('name', '%7º ANO A%');

  if (checkErr) console.error("Error checking final classrooms:", checkErr);
  else {
    console.log(`Final count of matching rooms: ${rooms.length}`);
    for (const r of rooms) {
      const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', r.id);
      console.log(`Remaining Class ID: ${r.id} | Name: [${r.name}] | Year: ${r.year} | Students: ${count}`);
    }
  }
}

deleteFinalDupe();
