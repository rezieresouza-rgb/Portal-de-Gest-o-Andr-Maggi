const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('--- Testando busca paralela de 80 mil registros ---');
  const start = Date.now();
  
  // 1. Get count first
  const { count, error: countErr } = await supabase
    .from('class_attendance_students')
    .select('*', { count: 'exact', head: true });
    
  if (countErr) {
    console.error('Erro na contagem:', countErr);
    return;
  }
  
  console.log(`Total de registros: ${count}. Disparando buscas em paralelo...`);
  
  const pageSize = 1000;
  const totalPages = Math.ceil(count / pageSize);
  const promises = [];
  
  for (let i = 0; i < totalPages; i++) {
    promises.push(
      supabase
        .from('class_attendance_students')
        .select('student_id, is_present')
        .range(i * pageSize, (i + 1) * pageSize - 1)
    );
  }
  
  const results = await Promise.all(promises);
  
  let allData = [];
  results.forEach((res, idx) => {
    if (res.error) {
      console.error(`Erro na página ${idx + 1}:`, res.error.message);
    } else if (res.data) {
      allData = allData.concat(res.data);
    }
  });
  
  console.log(`\nTempo total em paralelo: ${Date.now() - start}ms`);
  console.log(`Registros acumulados: ${allData.length}`);
}

check().catch(console.error);
