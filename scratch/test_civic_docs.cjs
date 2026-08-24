const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testCivicDocsStore() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('civic_documents').select('*').eq('template', 'official_oficio');
  if (error) {
    console.log('Error querying civic_documents:', error);
  } else {
    console.log('Successfully queried oficios inside civic_documents! Found:', data.length);
  }
}

testCivicDocsStore();
