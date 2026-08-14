const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findDuplicates() {
  console.log("=== CHECKING FOR ALL DUPLICATE STUDENTS IN DB ===");

  const { data: students } = await supabase
    .from('students')
    .select('*, enrollments(*, classrooms(*))');

  const nameMap = {};
  students?.forEach(s => {
    const normName = s.name.trim().toUpperCase();
    if (!nameMap[normName]) nameMap[normName] = [];
    nameMap[normName].push(s);
  });

  const duplicates = Object.entries(nameMap).filter(([name, list]) => list.length > 1);

  console.log(`\nFound ${duplicates.length} duplicate student names in database:\n`);

  duplicates.forEach(([name, list]) => {
    console.log(`👤 Student: ${name} (${list.length} records)`);
    list.forEach(s => {
      console.log(`   - ID: ${s.id} | Reg: ${s.registration_number} | Birth: ${s.birth_date} | Created: ${s.created_at}`);
      s.enrollments?.forEach(e => {
        console.log(`      * Enrollment: ${e.id} | Class: ${e.classrooms?.name} | Status: '${e.status}'`);
      });
    });
  });
}

findDuplicates();
