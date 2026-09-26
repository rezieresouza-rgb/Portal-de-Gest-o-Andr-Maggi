const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'sb_publishable_ShynnkPdqbx5Zzr0phpUHQ_L9s6LSy-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFabiana() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%Fabiana%');
    
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Fabiana:', JSON.stringify(data, null, 2));
  }
}

checkFabiana();
