const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabase = createClient(getEnvVar('VITE_SUPABASE_URL'), getEnvVar('VITE_SUPABASE_ANON_KEY'));

async function transferThreeFinal() {
  try {
    console.log("Iniciando transferência cirúrgica para unificação dos últimos remanescentes...\n");

    // 1. JÚLIA RAFAELA GOMES DA CRUZ -> JÚLLIA RAFAELA GOMES DA CRUZ
    const { data: g1 } = await supabase.from('students').select('id, name').eq('name', 'JÚLIA RAFAELA GOMES DA CRUZ').single();
    const activeIdJulia = '0a91061d-ddb9-415b-9763-510ccfeb30e8';
    if (g1) {
      console.log(`🔄 Migrando: "${g1.name}" 👉 "JÚLLIA RAFAELA GOMES DA CRUZ"`);
      await supabase.from('active_search_actions').update({ student_id: activeIdJulia }).eq('student_id', g1.id);
      await supabase.from('occurrences').update({ student_id: activeIdJulia }).eq('student_id', g1.id);
      await supabase.from('mediation_cases').update({ student_id: activeIdJulia }).eq('student_id', g1.id);
      
      const { error } = await supabase.from('students').delete().eq('id', g1.id);
      console.log(error ? `❌ Erro ao deletar fantasma: ${error.message}` : `✅ Fantasma deletado com sucesso!`);
    }

    // 2. TAKAKAJYHY METUKTIRE -> TAKAKAJYRY METUKTIRE
    const { data: g2 } = await supabase.from('students').select('id, name').eq('name', 'TAKAKAJYHY METUKTIRE').single();
    const activeIdTakak = 'eb93cd6b-295a-491f-848c-9f4b91d405dd';
    if (g2) {
      console.log(`\n🔄 Migrando: "${g2.name}" 👉 "TAKAKAJYRY METUKTIRE"`);
      await supabase.from('active_search_actions').update({ student_id: activeIdTakak }).eq('student_id', g2.id);
      await supabase.from('occurrences').update({ student_id: activeIdTakak }).eq('student_id', g2.id);
      await supabase.from('mediation_cases').update({ student_id: activeIdTakak }).eq('student_id', g2.id);
      
      const { error } = await supabase.from('students').delete().eq('id', g2.id);
      console.log(error ? `❌ Erro ao deletar fantasma: ${error.message}` : `✅ Fantasma deletado com sucesso!`);
    }

    // 3. Investigar ANA JULIA FERREIRA DA SILVA
    console.log(`\n🔍 Verificando variações para "ANA JULIA FERREIRA DA SILVA"...`);
    const { data: anaCandidates } = await supabase
      .from('students')
      .select('id, name, registration_number, enrollments(status, classrooms(name))')
      .ilike('name', '%ANA JULIA FERREIRA%');

    anaCandidates.forEach(c => {
      const enrs = c.enrollments || [];
      console.log(`   Candidata encontrada: "${c.name}" | ID: ${c.id} | Enturmações: ${enrs.length}`);
    });

  } catch (err) {
    console.error("Erro na migração final:", err.message);
  }
}

transferThreeFinal();
