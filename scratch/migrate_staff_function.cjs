const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function migrateStaffFunction() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Checking staff_members table...");
  const { data: staffData, error: staffErr } = await supabase.from('staff_members').select('*');
  if (staffData) {
    const toUpdate = staffData.filter(s => s.function_role === 'OFICIAL DE GESTÃO EDUCACIONAL');
    console.log(`Found ${toUpdate.length} staff members with 'OFICIAL DE GESTÃO EDUCACIONAL'`);
    for (const member of toUpdate) {
      console.log(`Updating ${member.name}...`);
      await supabase.from('staff_members').update({ function_role: 'GESTOR EDUCACIONAL MILITAR' }).eq('id', member.id);
    }
  }

  console.log("Migration finished!");
}

migrateStaffFunction();
