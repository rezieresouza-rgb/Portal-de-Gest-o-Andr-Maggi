const xlsx = require('xlsx');

try {
  const filePath = 'C:\\\\Users\\\\rezie\\\\OneDrive\\\\Área de Trabalho\\\\arquivos sistema\\\\HABILIDADES 6º ANO.xlsx';
  const workbook = xlsx.readFile(filePath);
  console.log("Planilhas encontradas:", workbook.SheetNames);
  
  const firstSheetName = 'DADOS';
  const worksheet = workbook.Sheets[firstSheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log("Quantidade de linhas (aba DADOS):", data.length);
  console.log("Estrutura da 1ª linha:", data[0]);
  console.log("Estrutura da 2ª linha:", data[1]);
  console.log("Estrutura da 3ª linha:", data[2]);
  console.log("Estrutura da 4ª linha:", data[3]);
  console.log("Estrutura da 5ª linha:", data[4]);
} catch (e) {
  console.error("Erro ao ler:", e.message);
}
