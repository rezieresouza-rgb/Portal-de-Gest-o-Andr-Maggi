const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join('C:', 'Users', 'rezie', 'OneDrive', 'Área de Trabalho', 'arquivos sistema', 'habilidades tods alunos.xlsx');

try {
  const workbook = xlsx.readFile(filePath);
  console.log('Planilhas:', workbook.SheetNames);
  
  const sheetName = workbook.SheetNames.includes('DADOS') ? 'DADOS' : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(sheet);
  console.log(`Linhas lidas: ${data.length}`);
  if (data.length > 0) {
    console.log('Exemplo (linha 1):', data[0]);
    console.log('Chaves (colunas):', Object.keys(data[0]));
  }
} catch (e) {
  console.error('Erro:', e);
}
