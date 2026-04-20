import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listColumns() {
  console.log("Inspecting columns of calendar_tracking...");
  
  // A trick to get column names: select 0 rows and check the returned structure or just a raw query
  const { data, error } = await supabase
    .from('calendar_tracking')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Existing columns:", Object.keys(data[0]));
  } else {
    console.log("Table is empty or columns hidden. Trying RPC or metadata...");
    // Fallback: Try to insert a dummy row to see what happens
    console.log("No rows found. Please check manually in Supabase.");
  }
}

listColumns();
