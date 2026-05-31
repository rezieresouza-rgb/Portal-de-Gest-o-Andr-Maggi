const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('--- Testando busca paginada de 80 mil registros ---');
  const start = Date.now();
  
  let allData = [];
  let page = 0;
  const pageSize = 5000;
  let hasMore = true;
  
  while (hasMore) {
    const pageStart = Date.now();
    const { data, error } = await supabase
      .from('class_attendance_students')
      .select('student_id, is_present')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error('Erro na pagina:', error);
      break;
    }
    
    if (data && data.length > 0) {
      allData = allData.concat(data);
      console.log(`Página ${page + 1} buscada em ${Date.now() - pageStart}ms (Acumulado: ${allData.length})`);
      hasMore = data.length === pageSize;
      page++;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`\nTempo total: ${Date.now() - start}ms`);
  console.log(`Registros totais acumulados: ${allData.length}`);
}

check().catch(console.error);
