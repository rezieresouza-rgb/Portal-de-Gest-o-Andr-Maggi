const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'sb_publishable_ShynnkPdqbx5Zzr0phpUHQ_L9s6LSy-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data: angelaData } = await supabase.from('users').select('*').ilike('name', '%Angela%');
  console.log('Angela:', JSON.stringify(angelaData, null, 2));

  const { data: zenirData } = await supabase.from('users').select('*').ilike('name', '%Zenir%');
  console.log('Zenir:', JSON.stringify(zenirData, null, 2));
}

checkUsers();
