const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase config missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Searching for 'Isabelly' in Supabase...");

  // Search in students table if exists
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('*')
    .ilike('name', '%Isabelly%');
  
  if (!sErr && students) {
    console.log("Found in 'students' table:", students);
  } else {
    console.log("Students search error or empty:", sErr);
  }

  // Search by class 9º ANO B
  const { data: studentsClass, error: scErr } = await supabase
    .from('students')
    .select('*')
    .ilike('classroom_name', '%9%B%');
  
  if (!scErr && studentsClass) {
    console.log("Students in 9º ANO B:", studentsClass.map(s => `${s.id} - ${s.name} (${s.classroom_name})`));
  }

  // Search in occurrences table if any
  const { data: occs, error: oErr } = await supabase
    .from('occurrences')
    .select('*')
    .ilike('student_name', '%Isabelly%');
  
  if (!oErr && occs) {
    console.log("Found in 'occurrences' table:", occs);
  }
}

run();
