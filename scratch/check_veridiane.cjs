const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkVeridiane() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching Veridiane from staff table...");
  const { data: staff, error } = await supabase.from('staff').select('*').ilike('name', '%VERIDIANE%');
  console.log("Found:", JSON.stringify(staff, null, 2));

  console.log("\nFetching movements for Veridiane...");
  if (staff && staff.length > 0) {
    const { data: movements } = await supabase.from('staff_movements').select('*').eq('staff_id', staff[0].id);
    console.log("Movements:", JSON.stringify(movements, null, 2));
  }
}

checkVeridiane();
