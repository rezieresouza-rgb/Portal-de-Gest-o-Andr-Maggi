const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'sb_publishable_ShynnkPdqbx5Zzr0phpUHQ_L9s6LSy-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNadja() {
  const { data } = await supabase.from('users').select('name, login, cpf');
  const filtered = data.filter(u => u.name.toLowerCase().includes('nad'));
  console.log('Nad*:', JSON.stringify(filtered, null, 2));
}

checkNadja();
