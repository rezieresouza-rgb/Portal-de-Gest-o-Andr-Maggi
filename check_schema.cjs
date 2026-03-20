const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'library_books' });
  if (error) {
    // Try raw SQL if RPC fails
    const { data: cols, error: colError } = await supabase.from('library_books').select('*').limit(1);
    console.log("Sample Data:", cols);
    // Information schema query
    const { data: schema, error: schemaError } = await supabase.from('_information_schema_columns').select('*').eq('table_name', 'library_books');
    // If we can't do that, just look at the sample data.
  } else {
    console.log(data);
  }
}
run();
