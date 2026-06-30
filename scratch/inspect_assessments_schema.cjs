require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.from('assessments').select('*').limit(1);
  if (error) {
    console.error("Error fetching from assessments:", error);
  } else if (data) {
    if (data.length > 0) {
      console.log("assessments columns:", Object.keys(data[0]));
    } else {
      console.log("assessments table is empty.");
      // Let's inspect the columns using pg_attribute or postgrest schema
      // Since it's postgrest, we can query the OpenAPI spec or just query table information
    }
  }
}

main();
