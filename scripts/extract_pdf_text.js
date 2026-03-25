
import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

async function extractText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdf(dataBuffer);
    console.log(`\n=== FILE: ${filePath} ===`);
    // Print first 500 chars to see format
    console.log(data.text.substring(0, 5000));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
}

const files = [
  'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/janeiro.pdf',
  'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/fevereiro.pdf',
  'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/março.pdf',
  'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/investimento janeiro.pdf',
  'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/investimento fevereiro.pdf',
  'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/investimento março.pdf'
];

async function run() {
  for (const file of files) {
    if (fs.existsSync(file)) {
      await extractText(file);
    } else {
      console.log(`File not found: ${file}`);
    }
  }
}

run();
