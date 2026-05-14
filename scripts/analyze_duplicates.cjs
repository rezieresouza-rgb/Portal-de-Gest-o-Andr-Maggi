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

// Função para normalizar nome (remove acentos, pontuações e deixa maiúsculo)
const normalize = (str) => {
  if (!str) return '';
  return str.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
};

async function analyzeDuplicates() {
  try {
    console.log("Analisando duplicações em toda a tabela de estudantes...\n");

    let allStudents = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
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
        .range(from, from + step - 1);

      if (error) throw error;

      allStudents.push(...data);
      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }

    // Agrupar por nome normalizado
    const groups = {};
    for (const st of allStudents) {
      const norm = normalize(st.name);
      if (!groups[norm]) {
        groups[norm] = [];
      }
      groups[norm].push(st);
    }

    // Identificar grupos com mais de 1 registro
    const duplicates = Object.keys(groups).filter(k => groups[k].length > 1);
    
    // Identificar também quase-duplicatas (ex: com um erro de digitação de 1 ou 2 letras)
    // Para simplificar, vamos listar as exatas após normalização
    console.log(`Encontrados ${duplicates.length} nomes com múltiplos cadastros na base geral!\n`);

    let countSemTurmaDuplicados = 0;

    duplicates.sort().forEach(name => {
      const list = groups[name];
      // Verificar se algum dos registros está Sem Turma
      const hasSemTurma = list.some(st => {
        const enrs = st.enrollments || [];
        const hasActive = enrs.some(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO');
        return !hasActive;
      });

      if (hasSemTurma) {
        countSemTurmaDuplicados++;
        console.log(`[DUPLICATA] ${name}:`);
        list.forEach(st => {
          const enrs = st.enrollments || [];
          const act = enrs.filter(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO');
          const statusStr = act.length > 0 ? `Ativo em: ${act.map(a => a.classrooms?.name).join(', ')}` : '⚠️ SEM TURMA / INATIVO';
          console.log(`   -> ID: ${st.id} | Matrícula: [${st.registration_number?.trim() || '---'}] | Nome Original: "${st.name}" | Vínculo: ${statusStr}`);
        });
        console.log('---');
      }
    });

    console.log(`\nResumo: Dos ${duplicates.length} grupos duplicados, ${countSemTurmaDuplicados} possuem pelo menos uma versão 'Sem Turma' (o que explica o inchaço da lista).`);

  } catch (err) {
    console.error("Erro na análise:", err.message);
  }
}

analyzeDuplicates();
