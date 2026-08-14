const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const downloads = 'C:\\Users\\rezie\\Downloads';
const file1 = path.join(downloads, '1 - Cronograma de Inspeções.docx.pdf');

async function dumpSignatures() {
  if (fs.existsSync(file1)) {
    const dataBuffer = fs.readFileSync(file1);
    const uint8 = new Uint8Array(dataBuffer);
    const parser = new PDFParse(uint8);
    const text = await parser.getText();
    const lines = text.text.split('\n');
    console.log('=== LAST 40 LINES OF DOC 1: ===');
    console.log(lines.slice(-40).join('\n'));
  }
}

dumpSignatures();
