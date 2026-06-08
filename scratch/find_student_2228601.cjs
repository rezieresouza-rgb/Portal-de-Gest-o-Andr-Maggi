const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('registration_number', '2228601');
    
  console.log('Results by registration_number:', data, error);
}

check();
