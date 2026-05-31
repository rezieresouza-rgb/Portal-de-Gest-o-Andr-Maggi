const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join('C:', 'Users', 'rezie', 'OneDrive', 'Área de Trabalho', 'arquivos sistema', 'habilidades tods alunos.xlsx');
const outputPath = path.join(__dirname, '..', 'data', 'habilidades_todas_turmas.json');

const targetSheets = [
  'LINGUAGENS - Alunos',
  'CIÊNCIAS HUMANAS - Alunos',
  'MATEMÁTICA - Alunos',
  'CIÊNCIAS DA NATUREZA - Alunos'
];

function getSubjectFromCode(code) {
  if (code.includes('LP')) return 'LÍNGUA PORTUGUESA';
  if (code.includes('AR')) return 'ARTE';
  if (code.includes('LI')) return 'LÍNGUA INGLESA';
  if (code.includes('EF') && !code.startsWith('EF0')) return 'EDUCAÇÃO FÍSICA'; // Wait, EF06EF01 is Educação Física
  if (code.match(/EF\d+EF/)) return 'EDUCAÇÃO FÍSICA'; 
  if (code.includes('HI')) return 'HISTÓRIA';
  if (code.includes('GE')) return 'GEOGRAFIA';
  if (code.includes('MA')) return 'MATEMÁTICA';
  if (code.includes('CI')) return 'CIÊNCIAS';
  return 'DESCONHECIDO';
}

function normalizeTurmaName(rawName) {
  // Converte "EF2-6º ANO-Vesp-D" para "6º ANO D"
  const match = rawName.match(/(\d+º\s*ANO).*?-([A-Z])$/i);
  if (match) {
    return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
  }
  return rawName.toUpperCase();
}

try {
  const workbook = xlsx.readFile(filePath);
  const result = {}; // Formato: { "6º ANO D": { "MATEMÁTICA": [ { codigo, descricao, rendimento, questoes } ] } }

  for (const sheetName of targetSheets) {
    if (!workbook.SheetNames.includes(sheetName)) continue;
    
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    // Agrupar por Turma e por Habilidade
    const stats = {}; 
    // stats[turma][habilidade_col] = { totalAlunos: 0, somaAcertos: 0 }

    for (const row of data) {
      if (!row['Turma']) continue;
      
      const turmaNormalizada = normalizeTurmaName(row['Turma']);
      
      if (!stats[turmaNormalizada]) {
        stats[turmaNormalizada] = {
           habilidades: {},
           alunos: {}
        };
      }
      
      const alunoNome = row['Aluno Nome'] || 'Desconhecido';
      if (!stats[turmaNormalizada].alunos[alunoNome]) {
         stats[turmaNormalizada].alunos[alunoNome] = {};
      }

      for (const key of Object.keys(row)) {
        if (['Aluno ID', 'Aluno Nome', 'Turma'].includes(key)) continue;
        
        if (!stats[turmaNormalizada].habilidades[key]) {
          stats[turmaNormalizada].habilidades[key] = { totalAlunos: 0, somaAcertos: 0 };
        }
        
        const val = row[key];
        if (val !== null && val !== undefined && val !== '') {
           stats[turmaNormalizada].habilidades[key].totalAlunos++;
           if (val === 1) {
             stats[turmaNormalizada].habilidades[key].somaAcertos++;
             stats[turmaNormalizada].alunos[alunoNome][key] = true;
           } else if (val === 0) {
             stats[turmaNormalizada].alunos[alunoNome][key] = false;
           }
        }
      }
    }

    // Calcular as porcentagens e organizar
    for (const turma of Object.keys(stats)) {
      if (!result[turma]) result[turma] = {};

      for (const hab_col of Object.keys(stats[turma].habilidades)) {
        const { totalAlunos, somaAcertos } = stats[turma].habilidades[hab_col];
        if (totalAlunos === 0) continue;

        let codigo = hab_col.split('-')[0].trim();
        let descricao = hab_col;

        const disciplina = getSubjectFromCode(codigo);
        
        if (!result[turma][disciplina]) {
          result[turma][disciplina] = {
             habilidades: [],
             alunos: {} // { "João": { "EF06MA...": true } }
          };
        }

        const rendimento = Math.round((somaAcertos / totalAlunos) * 100);

        result[turma][disciplina].habilidades.push({
          codigo,
          descricao,
          rendimento,
          disciplina,
          questoes: totalAlunos
        });
        
        // Passar os dados dos alunos que fizeram essa disciplina
        for (const aluno of Object.keys(stats[turma].alunos)) {
           if (!result[turma][disciplina].alunos[aluno]) {
              result[turma][disciplina].alunos[aluno] = {};
           }
           const hit = stats[turma].alunos[aluno][hab_col];
           if (hit !== undefined) {
              result[turma][disciplina].alunos[aluno][codigo] = hit;
           }
        }
      }
    }
  }

  // Converter para o formato array flat caso prefira ou manter hierarquico.
  // Vamos manter hierárquico pois é mais fácil buscar result[turma][disciplina].
  
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Arquivo salvo em: ${outputPath}`);

} catch (e) {
  console.error('Erro:', e);
}
