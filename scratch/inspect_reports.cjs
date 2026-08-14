const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const downloads = 'C:\\Users\\rezie\\Downloads';

const docxFiles = [
  '1 - Cronograma de Inspeções.docx',
  '2 - Ficha de Inspeções.docx',
  '3 - Relatório de Demanda.docx',
  '4 - Checklist de Intervenções.docx',
  '5 - Relatório de Verificação.docx',
  '6 - Justificativa de Pendências.docx',
  '7 - Plano de Boas Práticas.docx'
];

async function inspectDocx() {
  for (const f of docxFiles) {
    console.log('==================================================');
    console.log('FILE:', f);
    const filePath = path.join(downloads, f);
    if (fs.existsSync(filePath)) {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        console.log(result.value);
      } catch (err) {
        console.error('Error reading docx:', err.message);
      }
    } else {
      console.log('NOT FOUND:', filePath);
    }
  }
}

inspectDocx();
