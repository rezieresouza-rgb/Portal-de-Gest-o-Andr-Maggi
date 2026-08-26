const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function updateStaffAndOficios() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching staff table...");
  const { data: staffData, error: staffErr } = await supabase.from('staff').select('*');
  console.log("staff count:", staffData?.length, staffErr?.message || 'OK');

  if (staffData) {
    staffData.forEach(s => {
      console.log(`ID: ${s.id} | Name: "${s.name}" | Role: "${s.function_role || s.role}"`);
    });

    const marcelo = staffData.find(s => (s.name || '').toUpperCase().includes('MARCELO'));
    if (marcelo) {
      console.log(`Updating Marcelo da Silva in staff table (ID: ${marcelo.id}) -> GESTOR EDUCACIONAL MILITAR...`);
      await supabase.from('staff').update({ function_role: 'GESTOR EDUCACIONAL MILITAR' }).eq('id', marcelo.id);
    } else {
      console.log("Creating Marcelo da Silva in staff table...");
      await supabase.from('staff').insert([{
        id: crypto.randomUUID(),
        name: 'MARCELO DA SILVA',
        cpf: '00123041155',
        function_role: 'GESTOR EDUCACIONAL MILITAR',
        status: 'ATIVO',
        shift: 'INTEGRAL'
      }]);
    }
  }

  // Also update existing ofícios in civic_documents
  const { data: docs } = await supabase.from('civic_documents').select('*').eq('template', 'official_oficio');
  if (docs) {
    for (const d of docs) {
      if ((d.content?.signatory_name || '').toUpperCase().includes('MARCELO')) {
        console.log(`Updating signatory_role for doc ${d.id} -> GESTOR EDUCACIONAL MILITAR...`);
        const updatedContent = {
          ...d.content,
          signatory_role: 'GESTOR EDUCACIONAL MILITAR'
        };
        await supabase.from('civic_documents').update({ content: updatedContent }).eq('id', d.id);
      }
    }
  }

  console.log("\nDone updating staff and ofícios!");
}

updateStaffAndOficios();
