require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('staff_movements')
    .select('*')
    .limit(1);

  if (error) {
    console.error(error);
  } else {
    console.log("Staff Movement Sample Record:", data[0]);
    console.log("Columns:", Object.keys(data[0] || {}));
  }
}

main();
