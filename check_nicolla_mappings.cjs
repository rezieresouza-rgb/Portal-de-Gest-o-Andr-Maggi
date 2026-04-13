const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const fs = require('fs');
  const studentId = 'e6c54bcf-4006-4877-ba9f-bb7484fb7a60';
  
  // check enrollments
  const { data: mappings, error: mappingError } = await supabase
    .from('enrollments')
    .select('classroom_id, classrooms(name, year, shift)')
    .eq('student_id', studentId);
    
  if (mappingError) {
      console.log("Error querying student_classrooms:", mappingError);
  }

  const output = { 
    error: mappingError ? mappingError.message : null,
    mappings: mappings 
  };
  
  fs.writeFileSync('nicolla_mappings.json', JSON.stringify(output, null, 2));
}

run();
