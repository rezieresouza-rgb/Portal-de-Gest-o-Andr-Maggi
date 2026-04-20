require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('bncc_skills')
    .select('subject, year_range')
    .ilike('subject', '%INGLES%')
    .limit(10);

  if (error) {
    console.error(error);
  } else {
    console.log("English Skills in DB:", data);
  }
}

main();
