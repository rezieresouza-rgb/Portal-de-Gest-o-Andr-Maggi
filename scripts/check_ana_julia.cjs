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

async function checkAnaJulia() {
  try {
    const targetId = '34442fdc-d292-4373-a3d6-4d8346d9e0a8';

    console.log("=== FICHA CADASTRAL: ANA JULIA FERREIRA DA SILVA ===");
    const { data: st } = await supabase
      .from('students')
      .select('id, name, registration_number, enrollments(id, status, classrooms(name))')
      .eq('id', targetId)
      .single();

    if (st) {
      console.log(`Nome: ${st.name}`);
      console.log(`Matrícula: [${st.registration_number?.trim() || 'S/N'}]`);
      console.log(`Enturmações vinculadas: ${st.enrollments ? st.enrollments.length : 0}`);
      if (st.enrollments && st.enrollments.length > 0) {
        st.enrollments.forEach(e => console.log(` - Turma: ${e.classrooms?.name} | Status: ${e.status}`));
      } else {
        console.log(" - Nenhuma turma vinculada (está 'Sem Turma').");
      }
    }

    console.log("\n=== HISTÓRICO RETIDO NA BUSCA ATIVA ===");
    const { data: actions } = await supabase
      .from('active_search_actions')
      .select('*')
      .eq('student_id', targetId);

    if (actions && actions.length > 0) {
      actions.forEach(a => {
        console.log(`Ação: ${a.action_type} | Status: ${a.status} | Data: ${a.created_at}`);
        console.log(`Notas/Observações: ${a.notes || 'Nenhuma'}`);
        console.log("---");
      });
    } else {
      console.log("Nenhuma ação na tabela active_search_actions.");
    }

    console.log("\n=== OUTRAS ANA JULIAS ATIVAS NA ESCOLA ===");
    const { data: anas } = await supabase
      .from('students')
      .select('id, name, registration_number, enrollments(status, classrooms(name))')
      .ilike('name', 'ANA JULIA%');

    const ativas = anas.filter(a => a.id !== targetId && a.enrollments && a.enrollments.some(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO'));
    ativas.forEach(a => {
      const turmas = a.enrollments.map(e => e.classrooms?.name).join(', ');
      console.log(` - ${a.name} | Matrícula: [${a.registration_number?.trim()}] | Turma(s): ${turmas}`);
    });

  } catch (err) {
    console.error("Erro na busca:", err.message);
  }
}

checkAnaJulia();
