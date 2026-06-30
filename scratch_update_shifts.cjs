const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const updates = [
    { name: "EDINA PERTELI", id: "1771450394793.8528", shift: "VESPERTINO" },
    { name: "KEILA APARECIDA DOS SANTOS PINHEIRO DA SILVA", id: "1771450395533.5603", shift: "VESPERTINO" },
    { name: "RENATO LUIZ KLEIN", id: "1771450396720.384", shift: "VESPERTINO" }
  ];

  for (const item of updates) {
    const { data, error } = await supabase
      .from('staff')
      .update({ shift: item.shift })
      .eq('id', item.id);
    
    if (error) {
      console.error(`Error updating ${item.name}:`, error);
    } else {
      console.log(`Successfully updated ${item.name} to shift: ${item.shift}`);
    }
  }
}

run();
