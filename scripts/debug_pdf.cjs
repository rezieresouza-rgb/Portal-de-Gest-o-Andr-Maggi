
const fs = require('fs');
const pdf = require('pdf-parse');

async function extractText(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File does not exist: ${filePath}`);
      return;
    }
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    console.log(`\n=== FILE: ${filePath} ===`);
    console.log(data.text);
  } catch (err) {
    console.error(`ERROR in ${filePath}:`, err.message);
    if (err.stack) console.error(err.stack);
  }
}

const files = [
  'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/janeiro.pdf',
  'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/fevereiro.pdf',
  'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/março.pdf'
];

async function run() {
  for (const file of files) {
    await extractText(file);
  }
}

run();
