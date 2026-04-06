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

async function verify() {
  const { data: classrooms } = await supabase
    .from('classrooms')
    .select('id, name, year')
    .eq('name', '7º ANO A')
    .eq('year', '2026');

  let output = "Current 7º Ano A Classrooms (2026):\n";
  if (!classrooms || classrooms.length === 0) {
    output += "No classrooms found!";
  } else {
    for (const c of classrooms) {
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('classroom_id', c.id);
      output += `- ID: ${c.id} | Name: ${c.name} | Students: ${count}\n`;
    }
  }
  fs.writeFileSync('verification_results.txt', output);
  console.log("Results written to verification_results.txt");
}

verify();
