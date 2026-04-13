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

async function scanAll() {
  console.log("Scanning for ALL classrooms matching '7' and 'A'...");
  
  const { data: classrooms, error } = await supabase
    .from('classrooms')
    .select('id, name, year, shift');

  if (error) {
    console.error("Error fetching classrooms:", error);
    return;
  }

  const matches = classrooms.filter(c => 
    c.name.toUpperCase().includes('7') && 
    c.name.toUpperCase().includes('A')
  );

  for (const c of matches) {
    const { count } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('classroom_id', c.id);
    
    console.log(`ID: ${c.id} | Name: [${c.name}] | Year: ${c.year} | Shift: ${c.shift} | Students: ${count}`);
  }
}

scanAll();
