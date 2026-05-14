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

const missingRegs = ["2666159", "2287110", "2671389", "2709316", "2683198", "2676547", "2734579"];

async function checkMissing() {
  console.log("=== STATUS DOS 7 ALUNOS FALTANTES NO 6º ANO D ===\n");
  for (const reg of missingRegs) {
    const { data: st } = await supabase.from('students').select('id, name, registration_number').eq('registration_number', reg).maybeSingle();
    if (st) {
      // Verificar onde está matriculado
      const { data: enrs } = await supabase.from('enrollments').select('status, classrooms(name)').eq('student_id', st.id);
      if (enrs && enrs.length > 0) {
        const turmas = enrs.map(e => `${e.classrooms?.name} (${e.status})`).join(', ');
        console.log(`- [${st.registration_number}] ${st.name}: Cadastrado no sistema. Enturmações ativas/inativas: ${turmas}`);
      } else {
        console.log(`- [${st.registration_number}] ${st.name}: Cadastrado no sistema, mas SEM NENHUMA TURMA vinculada.`);
      }
    } else {
      console.log(`- [${reg}]: NÃO EXISTE na tabela de estudantes do sistema.`);
    }
  }
}

checkMissing();
