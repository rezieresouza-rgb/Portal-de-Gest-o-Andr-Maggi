const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkAndUpdateStaff() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching staff_members...");
  const { data: staff, error: staffErr } = await supabase.from('staff_members').select('*');
  console.log("Staff count:", staff?.length);
  if (staff && staff.length > 0) {
    staff.forEach(s => console.log(`Staff ID: ${s.id} | Name: "${s.name}" | Role: "${s.function_role}"`));
  }

  // Update or insert Marcelo da Silva in staff_members if needed
  const marcelo = staff?.find(s => (s.name || '').toUpperCase().includes('MARCELO'));
  if (marcelo) {
    console.log(`Updating Marcelo da Silva (ID: ${marcelo.id}) function_role to 'GESTOR EDUCACIONAL MILITAR'...`);
    await supabase.from('staff_members').update({ function_role: 'GESTOR EDUCACIONAL MILITAR' }).eq('id', marcelo.id);
  } else {
    console.log("Marcelo da Silva not found in staff_members. Creating entry...");
    await supabase.from('staff_members').insert([{
      id: crypto.randomUUID(),
      name: 'MARCELO DA SILVA',
      cpf: '00000000000',
      function_role: 'GESTOR EDUCACIONAL MILITAR',
      status: 'ATIVO',
      shift: 'INTEGRAL'
    }]);
  }

  // Also update existing ofícios in civic_documents where signatory_name is MARCELO DA SILVA
  console.log("\nUpdating existing ofícios in civic_documents...");
  const { data: docs } = await supabase.from('civic_documents').select('*').eq('template', 'official_oficio');
  if (docs) {
    for (const d of docs) {
      if ((d.content?.signatory_name || '').toUpperCase().includes('MARCELO')) {
        console.log(`Updating signatory_role for doc ${d.id}...`);
        const updatedContent = {
          ...d.content,
          signatory_role: 'GESTOR EDUCACIONAL MILITAR'
        };
        await supabase.from('civic_documents').update({ content: updatedContent }).eq('id', d.id);
      }
    }
  }

  console.log("\nDone checking staff roles!");
}

checkAndUpdateStaff();
