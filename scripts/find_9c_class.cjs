const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findC() {
  const { data, error } = await supabase.from('classrooms').select('id, name').ilike('name', '9\u00ba ANO C');
  if (error) console.error(error);
  console.log(data);
}

findC();
