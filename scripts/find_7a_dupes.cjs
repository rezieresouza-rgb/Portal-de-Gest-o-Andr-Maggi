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

async function findDupes() {
  console.log("Searching for duplicated 7º Ano A classrooms...");
  
  const { data: classrooms, error } = await supabase
    .from('classrooms')
    .select('id, name, year')
    .eq('name', '7º ANO A')
    .eq('year', '2026');

  if (error) {
    console.error("Error fetching classrooms:", error);
    return;
  }

  for (const room of classrooms) {
    const { count, error: countErr } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('classroom_id', room.id);
    
    console.log(`Class ID: ${room.id} | Name: ${room.name} | Students: ${count}`);
    
    // Check for other linked data
    const { count: gradesCount } = await supabase.from('grades').select('*', { count: 'exact', head: true }).eq('classroom_id', room.id);
    const { count: attendanceCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('classroom_id', room.id);
    
    if (gradesCount > 0 || attendanceCount > 0) {
      console.log(`  WARNING: This class has ${gradesCount} grades and ${attendanceCount} attendance records!`);
    }
  }
}

findDupes();
