require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('mediation_cases')
    .select('*')
    .or('student_name.ilike.%luan%,student_name.ilike.%davi%');

  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Found cases:', JSON.stringify(data, null, 2));
  }
}

main();
