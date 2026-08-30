const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\rezie\\.gemini\\antigravity\\brain\\fba309ea-1c04-4eee-b5ba-2c39348eef86\\scratch\\parsed_sydle_paf.txt', 'utf-8');

// Let's analyze how classes and values are formatted
// In the text, each entry has:
// Classe Material
// Tipo Material
// Recurso Utilizado (PDE – SEDUC)
// Valor estimado (ex: R$ 12.000,00, R$ 13.000,00, etc.)

// Let's write a parser that detects every "PDE – SEDUC" and its preceding class and trailing value!
const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

console.log('Total non-empty lines:', lines.length);

const items = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('PDE – SEDUC') || line.includes('PDE - SEDUC') || line.includes('R$ ')) {
    // Look around
  }
}

// Let's print all lines containing "R$" to inspect the values
const rDollarLines = lines.filter(l => l.includes('R$ '));
console.log('Total lines with R$:', rDollarLines.length);
rDollarLines.forEach((l, idx) => console.log(`${idx + 1}: ${l}`));
