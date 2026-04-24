const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching student:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Columns in 'students' table:", Object.keys(data[0]));
  } else {
    console.log("No data found in 'students' table to check columns.");
  }
}

checkColumns();
