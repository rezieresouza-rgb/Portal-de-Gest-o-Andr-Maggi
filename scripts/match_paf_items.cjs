const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\rezie\\.gemini\\antigravity\\brain\\fba309ea-1c04-4eee-b5ba-2c39348eef86\\scratch\\parsed_sydle_paf.txt', 'utf-8');

// Let's find every occurrence of "PDE – SEDUC R$ ..." or similar and match with the material class preceding it
const pages = raw.split(/-- \d+ of 29 --/);

const entries = [];
let currentGroup = 'CUSTEIO';

for (let pIdx = 0; pIdx < pages.length; pIdx++) {
  const p = pages[pIdx];
  if (p.includes('Etapas de execução capital')) {
    currentGroup = 'CAPITAL';
  }

  // Find all PDE – SEDUC R$ ...
  const matches = p.match(/PDE\s*–\s*SEDUC\s*R\$\s*[\d\.\,]+/g);
  if (matches) {
    console.log(`Page ${pIdx + 1} (${currentGroup}):`, matches);
  }
}
