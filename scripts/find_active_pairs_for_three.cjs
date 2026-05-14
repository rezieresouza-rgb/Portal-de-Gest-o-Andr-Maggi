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

async function findPairs() {
  try {
    console.log("Buscando ativamente os pares correspondentes para os 3 alunos retidos...\n");

    const targets = [
      { name: "ANA JULIA FERREIRA DA SILVA", searchName: "%ANA JULIA%" },
      { name: "JÚLIA RAFAELA GOMES DA CRUZ", searchName: "%GOMES DA CRUZ%" },
      { name: "TAKAKAJYHY METUKTIRE", searchName: "%TAKAKAJY%" }
    ];

    for (const t of targets) {
      console.log(`🔍 Pesquisando candidatas ativas para: "${t.name}"`);
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          registration_number,
          enrollments (
            status,
            classrooms (name)
          )
        `)
        .ilike('name', t.searchName);

      if (error) throw error;

      const actives = data.filter(st => st.enrollments && st.enrollments.some(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO'));

      if (actives.length > 0) {
        actives.forEach(act => {
          const cnames = act.enrollments.map(e => e.classrooms?.name).join(', ');
          console.log(`   👉 Encontrado Par Ativo: "${act.name}" | ID: ${act.id} | Matrícula: [${act.registration_number?.trim() || 'S/N'}] | Turma: ${cnames}`);
        });
      } else {
        console.log(`   ⚠️ Nenhum par atualmente ATIVO encontrado com esse padrão.`);
        // Listar todos encontrados para inspeção
        data.forEach(d => console.log(`      Candidato Inativo/SemTurma: "${d.name}" | ID: ${d.id}`));
      }
      console.log("---");
    }

  } catch (err) {
    console.error("Erro na busca:", err.message);
  }
}

findPairs();
