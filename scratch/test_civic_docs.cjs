const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xxxx.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'xxxx';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCivicDocs() {
  console.log('Checking civic_documents table...');
  const { data, error } = await supabase
    .from('civic_documents')
    .select('*')
    .limit(5);

  console.log('Error:', error);
  console.log('Data:', data);
}

checkCivicDocs();
