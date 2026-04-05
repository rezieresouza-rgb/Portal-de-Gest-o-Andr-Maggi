const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function findClass() {
  const { data: classrooms, error } = await supabase
    .from('classrooms')
    .select('*, enrollments(count)')
    .ilike('name', '%6%A%');
  
  if (error) return console.error(error);
  console.log("Found Classrooms:", JSON.stringify(classrooms, null, 2));
}

findClass();
