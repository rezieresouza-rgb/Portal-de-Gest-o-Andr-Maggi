const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  const index = line.indexOf('=');
  if (index !== -1) {
    const key = line.substring(0, index).trim();
    const value = line.substring(index + 1).trim();
    env[key] = value;
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function main() {
  const { data: rows, error: getError } = await supabase.from('preventive_maintenance_plan').select('id').limit(1);
  if (getError || !rows || rows.length === 0) {
    console.error("Error getting row:", getError);
    return;
  }
  const id = rows[0].id;
  const testUuid = '11111111-1111-1111-1111-111111111111';
  console.log("Attempting to update responsible_id to random UUID:", testUuid);
  const { data, error } = await supabase
    .from('preventive_maintenance_plan')
    .update({ responsible_id: testUuid })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error("Update failed! Error:", error);
  } else {
    console.log("Update succeeded! There is NO foreign key constraint on this column. Returned data:", data);
    // Revert it back to null
    await supabase.from('preventive_maintenance_plan').update({ responsible_id: null }).eq('id', id);
  }
}

main();
