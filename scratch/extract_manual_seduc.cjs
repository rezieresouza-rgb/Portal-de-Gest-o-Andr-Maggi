const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const downloads = 'C:\\Users\\rezie\\Downloads';
const manualPath = path.join(downloads, 'MANUAL DE MANUTENÇÃO - SEDUC-MT -  2025.pdf');

async function inspectManual() {
  if (!fs.existsSync(manualPath)) {
    console.error('Manual file not found at:', manualPath);
    return;
  }

  const dataBuffer = fs.readFileSync(manualPath);
  const uint8 = new Uint8Array(dataBuffer);
  const parser = new PDFParse(uint8);
  const text = await parser.getText();

  console.log('=== MANUAL DE MANUTENÇÃO SEDUC-MT 2025 ===');
  console.log('TOTAL PAGES:', text.numpages);
  console.log('\n--- FIRST 3000 CHARACTERS ---');
  console.log(text.text.substring(0, 3000));

  // Save full text to scratch file for thorough searching
  fs.writeFileSync('scratch/manual_seduc_2025_full_text.txt', text.text, 'utf8');
  console.log('\nFull manual text saved to scratch/manual_seduc_2025_full_text.txt');
}

inspectManual();
