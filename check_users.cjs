const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'sb_publishable_ShynnkPdqbx5Zzr0phpUHQ_L9s6LSy-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data: anaiaraData } = await supabase.from('users').select('*').ilike('name', '%Anaiara%');
  console.log('Anaiara:', JSON.stringify(anaiaraData, null, 2));

  const { data: rafaelData } = await supabase.from('users').select('*').ilike('name', '%Rafael%');
  console.log('Rafael:', JSON.stringify(rafaelData, null, 2));
}

checkUsers();
