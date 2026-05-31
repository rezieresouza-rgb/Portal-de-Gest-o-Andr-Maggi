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
        stats[turmaNormalizada] = {};
      }

      for (const key of Object.keys(row)) {
        if (['Aluno ID', 'Aluno Nome', 'Turma'].includes(key)) continue;
        
        if (!stats[turmaNormalizada][key]) {
          stats[turmaNormalizada][key] = { totalAlunos: 0, somaAcertos: 0 };
        }
        
        const val = row[key];
        if (val !== null && val !== undefined && val !== '') {
           stats[turmaNormalizada][key].totalAlunos++;
           if (val === 1) {
             stats[turmaNormalizada][key].somaAcertos++;
           }
        }
      }
    }

    // Calcular as porcentagens e organizar
    for (const turma of Object.keys(stats)) {
      if (!result[turma]) result[turma] = {};

      for (const hab_col of Object.keys(stats[turma])) {
        const { totalAlunos, somaAcertos } = stats[turma][hab_col];
        if (totalAlunos === 0) continue;

        // hab_col is usually something like "EF06MA03MT01- CALCULAR O RESULTADO..."
        let codigo = hab_col.split('-')[0].trim();
        let descricao = hab_col;

        const disciplina = getSubjectFromCode(codigo);
        
        if (!result[turma][disciplina]) {
          result[turma][disciplina] = [];
        }

        const rendimento = Math.round((somaAcertos / totalAlunos) * 100);

        result[turma][disciplina].push({
          codigo,
          descricao,
          rendimento,
          disciplina,
          questoes: totalAlunos // para contexto, embora seja alunos, podemos mandar como volume
        });
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
