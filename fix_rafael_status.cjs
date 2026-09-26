const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'sb_publishable_ShynnkPdqbx5Zzr0phpUHQ_L9s6LSy-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRafael() {
  const { data, error } = await supabase
    .from('staff')
    .update({ status: 'EM_ATIVIDADE' })
    .eq('cpf', '86238270586')
    .select();
    
  if (error) {
    console.error('Error updating staff:', error);
  } else {
    console.log('Rafael updated:', JSON.stringify(data, null, 2));
  }
}

fixRafael();
