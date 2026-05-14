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

async function generateMarkdownReport() {
  try {
    console.log("Gerando relatório completo em Markdown...");

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
          status,
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

    const semMatriculaAlguma = [];
    const apenasInativos = [];

    for (const st of allStudents) {
      const enrs = st.enrollments || [];
      if (enrs.length === 0) {
        semMatriculaAlguma.push(st);
      } else {
        const hasActive = enrs.some(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO');
        if (!hasActive) {
          apenasInativos.push(st);
        }
      }
    }

    semMatriculaAlguma.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    apenasInativos.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    let md = `# 📊 Relatório de Auditoria: Alunos Sem Turma Vinculada
**Data da Extração:** ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}  
**Total Geral de Alunos com Pendência de Vínculo:** ${semMatriculaAlguma.length + apenasInativos.length} alunos

---

## 🔴 1. Alunos Sem Nenhuma Matrícula Registrada (${semMatriculaAlguma.length})
Estes alunos estão cadastrados na base geral de estudantes da escola, mas **nunca foram enturmados** em nenhuma classe no sistema digital ou tiveram o vínculo excluído.

| Nº | Matrícula | Nome Completo | Situação Cadastral |
| :---: | :---: | :--- | :---: |
`;

    semMatriculaAlguma.forEach((st, idx) => {
      md += `| **${idx + 1}** | \`${st.registration_number?.trim() || '---'}\` | ${st.name?.trim() || '---'} | ⚠️ Sem Vínculo |\n`;
    });

    md += `\n---\n\n## 🟡 2. Alunos Apenas com Histórico Inativo (${apenasInativos.length})
Estes alunos possuem registros anteriores em turmas, mas todos os vínculos constam atualmente como **Transferidos, Desligados ou Inativos**.

| Nº | Matrícula | Nome Completo | Último Status | Histórico de Turmas |
| :---: | :---: | :--- | :---: | :--- |
`;

    apenasInativos.forEach((st, idx) => {
      const hist = st.enrollments.map(e => `${e.classrooms?.name || '---'} (${e.status})`).join('<br>');
      const lastStatus = st.enrollments[0]?.status || st.status || 'TRANSFERIDO';
      md += `| **${idx + 1}** | \`${st.registration_number?.trim() || '---'}\` | ${st.name?.trim() || '---'} | <span style="color:#d97706;font-weight:bold;">${lastStatus}</span> | ${hist} |\n`;
    });

    const outputPath = path.join(__dirname, '..', 'relatorio_alunos_sem_turma.md');
    fs.writeFileSync(outputPath, md, 'utf8');

    console.log(`✅ Relatório gravado com sucesso em: ${outputPath}`);

  } catch (err) {
    console.error("Erro ao gerar MD:", err.message);
  }
}

generateMarkdownReport();
