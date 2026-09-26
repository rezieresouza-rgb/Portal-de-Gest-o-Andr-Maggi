const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'sb_publishable_ShynnkPdqbx5Zzr0phpUHQ_L9s6LSy-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const names = ['Maria Aparecida', 'Marli', 'Jhenifa', 'Nadja', 'Adriana'];
  
  for (const name of names) {
    const { data } = await supabase.from('users').select('name, login, cpf').ilike('name', `%${name}%`);
    console.log(`${name}:`, JSON.stringify(data, null, 2));
  }
}

checkUsers();
