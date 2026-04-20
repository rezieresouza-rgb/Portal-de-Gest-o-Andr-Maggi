require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'GESTAO' })
    .eq('id', '2df94f13-6a7d-48f3-be35-2cb1df889dcd');

  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Update success!', data);
  }
}

main();
