const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findD() {
  const { data, error } = await supabase.from('classrooms').select('id, name').ilike('name', '9\u00ba ANO D');
  if (error) console.error(error);
  console.log(data);
}

findD();
