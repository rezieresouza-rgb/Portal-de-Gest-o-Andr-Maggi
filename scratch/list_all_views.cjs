const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('--- Listando tabelas e views do banco de dados ---');
  
  // We can query the information_schema via standard REST API if exposed, or let's try querying standard tables
  const { data: tables, error } = await supabase
    .from('_information_schema_tables') // Let's check if there's any proxy or we can query
    .select('*')
    .limit(10);
    
  if (error) {
    console.log('Erro ao ler _information_schema_tables, tentando outra forma...');
  } else {
    console.log('Tabelas:', tables);
  }
}

check().catch(console.error);
