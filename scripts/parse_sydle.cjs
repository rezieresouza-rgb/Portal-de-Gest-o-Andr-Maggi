const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function parsePdf() {
  const downloadsDir = 'C:\\Users\\rezie\\Downloads';
  const files = fs.readdirSync(downloadsDir).filter(f => f.includes('SYDLE'));
  console.log('Found files:', files);

  if (files.length === 0) return;

  const targetFile = path.join(downloadsDir, files[0]);
  const dataBuffer = fs.readFileSync(targetFile);
  
  const data = await pdf(dataBuffer);
  console.log('PDF Pages:', data.numpages);
  console.log('PDF Text length:', data.text.length);
  
  fs.writeFileSync('C:\\Users\\rezie\\.gemini\\antigravity\\brain\\fba309ea-1c04-4eee-b5ba-2c39348eef86\\scratch\\parsed_sydle_paf.txt', data.text);
  console.log('Saved to scratch/parsed_sydle_paf.txt');
}

parsePdf().catch(console.error);
