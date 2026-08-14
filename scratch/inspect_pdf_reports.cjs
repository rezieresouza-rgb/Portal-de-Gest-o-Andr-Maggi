const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const downloads = 'C:\\Users\\rezie\\Downloads';

const pdfFiles = [
  '1 - Cronograma de Inspeções.docx.pdf',
  '2 - Ficha de Inspeções.docx.pdf',
  '3 - Relatório de Demanda.docx.pdf',
  '4 - Checklist de Intervenções.docx.pdf',
  '5 - Relatório de Verificação.docx.pdf',
  '6 - Justificativa de Pendências.docx.pdf',
  '7 - Plano de Boas Práticas.docx.pdf'
];

async function inspectPdfs() {
  for (const f of pdfFiles) {
    console.log('==================================================');
    console.log('FILE:', f);
    const filePath = path.join(downloads, f);
    if (fs.existsSync(filePath)) {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const uint8 = new Uint8Array(dataBuffer);
        const parser = new PDFParse(uint8);
        const text = await parser.getText();
        console.log(text.text);
      } catch (err) {
        console.error('Error reading pdf:', err.message);
      }
    } else {
      console.log('NOT FOUND:', filePath);
    }
  }
}

inspectPdfs();
