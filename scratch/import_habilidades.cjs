const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

try {
  const filePath = 'C:\\\\Users\\\\rezie\\\\OneDrive\\\\Área de Trabalho\\\\arquivos sistema\\\\HABILIDADES 6º ANO.xlsx';
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets['DADOS'];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Data starts at index 1
  const habilidades = [];
  for (let i = 1; i < data.length; i++) {
     const row = data[i];
     if (!row || row.length === 0) continue;
     
     const descricaoCompleta = row[0]; // e.g. "EF0 - EF06HI06MT1-Identificar geograficamente..."
     let codigo = "N/A";
     let texto = descricaoCompleta;
     
     // Tentativa de separar código e texto (ex: "EF0 - EF06HI06MT1-Identificar geograficamente")
     const match = descricaoCompleta.match(/(EF\w+)\s*-(.*)/);
     if (match) {
        codigo = match[1].trim();
        texto = match[2].trim();
     }

     const rendimentoStr = row[1]; // e.g. "33%"
     const rendimento = parseFloat(rendimentoStr.replace('%', ''));
     const disciplina = row[2]; // e.g. "História"
     const questoes = parseInt(row[3]); // e.g. 12
     
     habilidades.push({
        codigo,
        descricao: descricaoCompleta,
        rendimento,
        disciplina: disciplina.toUpperCase(),
        questoes
     });
  }

  // Ensure directory exists
  const dirPath = path.join(__dirname, '../data');
  if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
  }

  const outputPath = path.join(dirPath, 'habilidades_6ano.json');
  fs.writeFileSync(outputPath, JSON.stringify(habilidades, null, 2), 'utf-8');
  console.log(`Sucesso! ${habilidades.length} habilidades exportadas para ${outputPath}`);

} catch (e) {
  console.error("Erro ao converter:", e.message);
}
