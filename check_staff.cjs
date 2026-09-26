const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'sb_publishable_ShynnkPdqbx5Zzr0phpUHQ_L9s6LSy-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .ilike('name', '%Fabiana%');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Staff:', JSON.stringify(data, null, 2));
  }
}

checkStaff();
