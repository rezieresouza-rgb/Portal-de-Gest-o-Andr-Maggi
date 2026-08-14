const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const downloads = 'C:\\Users\\rezie\\Downloads';
const file1 = path.join(downloads, '1 - Cronograma de Inspeções.docx.pdf');

async function dumpDoc1() {
  if (fs.existsSync(file1)) {
    const dataBuffer = fs.readFileSync(file1);
    const uint8 = new Uint8Array(dataBuffer);
    const parser = new PDFParse(uint8);
    const text = await parser.getText();
    console.log('=== TOTAL PAGES:', text.numpages, '===');
    console.log(text.text);
  } else {
    console.log('File not found:', file1);
  }
}

dumpDoc1();
