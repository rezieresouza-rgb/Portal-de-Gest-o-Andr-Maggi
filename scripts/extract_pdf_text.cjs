
const fs = require('fs');
const pdf = require('pdf-parse');

async function extractText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdf(dataBuffer);
    console.log(`\n=== FILE: ${filePath} ===`);
    // Print the whole text or a substantial portion to parse
    console.log(data.text);
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
