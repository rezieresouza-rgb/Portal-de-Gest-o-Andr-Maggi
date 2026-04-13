const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: students, error: searchError } = await supabase
    .from('students')
    .select('*')
    .ilike('name', '%NICOLLA%LINDCIA%');

  if (searchError) {
    console.error('Error:', searchError);
    return;
  }
  const fs = require('fs');
  const output = { students: students, rooms: [] };
  
  if (students && students.length > 0) {
      for (const student of students) {
          if (student.classroom_id) {
              const { data: room } = await supabase.from('classrooms').select('*').eq('id', student.classroom_id).single();
              output.rooms.push({ studentName: student.name, room });
          } else {
              output.rooms.push({ studentName: student.name, room: null, note: "No classroom_id" });
          }
      }
  }
  fs.writeFileSync('nicolla_info.json', JSON.stringify(output, null, 2));
}

run();
