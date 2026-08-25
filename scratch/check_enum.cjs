const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testEnum() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  const testValues = ['MEDIACAO', 'MEDIAÇÃO', 'PSICOSSOCIAL', 'GESTAO', 'SECRETARIA', 'PROFESSOR', 'MONITORIA'];
  for (const v of testValues) {
    const { error } = await supabase.from('users').update({ role: v }).eq('id', '30362b69-8ca7-427c-b100-d348f9c30b48').select();
    if (error) {
      console.log(`Value '${v}': FAILED -> ${error.message}`);
    } else {
      console.log(`Value '${v}': SUCCESS!`);
      break;
    }
  }
}

testEnum();
