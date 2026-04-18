
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDanubia() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or('name.ilike.%DANUBIA%,login.ilike.%DANUBIA%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Danubia Info:', JSON.stringify(data, null, 2));
}

checkDanubia();
