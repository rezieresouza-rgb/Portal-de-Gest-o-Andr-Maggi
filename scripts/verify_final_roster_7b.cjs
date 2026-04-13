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

async function verifyRoster() {
  const roomId = '42028b9e-a0c8-41b3-9538-915a9109fe7b'; // 7º ANO B
  console.log(`Verifying roster for 7º ANO B (${roomId})...`);

  const { data: enrollments, error: enrollError } = await supabase
     .from('enrollments')
     .select(`
        student_id,
        students (*)
     `)
     .eq('classroom_id', roomId);

  if (enrollError) {
    console.error("Error fetching enrollments:", enrollError.message);
    return;
  }

  console.log(`Total enrollments found: ${enrollments.length}`);

  const formatted = enrollments.map((e, index) => {
    const s = e.students;
    return {
      index: index + 1,
      id: e.student_id,
      name: s ? s.name : '!!! NULL STUDENT RECORD !!!',
      registration: s ? s.registration_number : 'N/A',
      status: s ? s.status : 'N/A'
    };
  });

  // Sort alphabetically by name
  formatted.sort((a, b) => a.name.localeCompare(b.name));

  console.log("\n--- OFFICIAL 7º ANO B ROSTER ---");
  formatted.forEach(s => {
    console.log(`${s.index.toString().padStart(2)}. ${s.name.padEnd(40)} | Reg: ${s.registration.padEnd(10)} | Status: ${s.status}`);
  });

  const hevilly = formatted.find(s => s.name.includes('HEVILLY'));
  if (hevilly) {
    console.log(`\nSUCCESS: HEVILLY GARCIA JARDIM found with ID ${hevilly.id} and status ${hevilly.status}.`);
  } else {
    console.log("\nERROR: HEVILLY GARCIA JARDIM NOT FOUND IN ROSTER!");
  }
}

verifyRoster();
