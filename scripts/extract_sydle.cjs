const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function run() {
  const filePath = path.join('C:\\Users\\rezie\\Downloads', 'Geração de Plano de Aplicação Financeira _ SYDLE APP.pdf');
  const buffer = fs.readFileSync(filePath);
  
  const parser = new PDFParse({ data: buffer });
  await parser.load();
  
  const textResult = await parser.getText();
  console.log('Text result keys:', Object.keys(textResult));
  console.log('Total pages:', textResult.pages?.length || textResult.text?.length);
  
  const fullText = typeof textResult === 'string' ? textResult : (textResult.text || JSON.stringify(textResult, null, 2));
  fs.writeFileSync('C:\\Users\\rezie\\.gemini\\antigravity\\brain\\fba309ea-1c04-4eee-b5ba-2c39348eef86\\scratch\\parsed_sydle_paf.txt', fullText, 'utf-8');

  try {
    const tables = await parser.getPageTables();
    fs.writeFileSync('C:\\Users\\rezie\\.gemini\\antigravity\\brain\\fba309ea-1c04-4eee-b5ba-2c39348eef86\\scratch\\parsed_sydle_tables.json', JSON.stringify(tables, null, 2), 'utf-8');
    console.log('Tables extracted:', tables?.length);
  } catch (e) {
    console.log('Error extracting tables:', e.message);
  }

  console.log('Finished writing parsed files.');
}

run().catch(console.error);
