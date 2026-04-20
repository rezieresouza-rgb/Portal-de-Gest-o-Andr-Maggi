require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.from('mediation_cases').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log("Columns in mediation_cases:", Object.keys(data[0] || {}));
  }
}

main();
