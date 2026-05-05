const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      name,
      enrollments (
        status,
        enrollment_date,
        classrooms (name)
      )
    `)
    .ilike('name', '%GABRIEL HENRIKE%');

  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

check();
