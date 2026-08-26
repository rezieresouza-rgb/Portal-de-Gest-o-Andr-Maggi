const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function revertVeridiane() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("1. Reverting status of Veridiane Zanella Welter (ID: 1771450394048.2927) to 'EM_ATIVIDADE'...");
  const { error: updateErr } = await supabase
    .from('staff')
    .update({ status: 'EM_ATIVIDADE' })
    .eq('id', '1771450394048.2927');

  if (updateErr) {
    console.error("Failed to update status:", updateErr);
  } else {
    console.log("SUCCESS: Veridiane status is now 'EM_ATIVIDADE'!");
  }

  console.log("2. Deleting accidental DESLIGAMENTO movement (ID: ce04347e-24d4-44de-a758-fc36466dfb16)...");
  const { error: delErr } = await supabase
    .from('staff_movements')
    .delete()
    .eq('id', 'ce04347e-24d4-44de-a758-fc36466dfb16');

  if (delErr) {
    console.error("Failed to delete movement:", delErr);
  } else {
    console.log("SUCCESS: Accidental DESLIGAMENTO movement deleted!");
  }

  console.log("\nReversion complete!");
}

revertVeridiane();
