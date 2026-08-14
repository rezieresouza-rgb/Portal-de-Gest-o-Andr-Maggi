const fs = require('fs');

const buf = fs.readFileSync('C:\\Users\\rezie\\Downloads\\2 - Ficha de Inspeções.docx.pdf');
const content = buf.toString('latin1');

// Match all printable Portuguese text sequences (words, lines, headings, tables)
const textBlocks = content.match(/[\wÀ-ÿ0-9\s.,:\-\/\(\)\%\º\ª\$\;]{3,}/g) || [];

// Filter out PDF stream artifacts
const cleanBlocks = textBlocks
  .map(b => b.trim())
  .filter(b => b.length > 3 && !b.includes('Obj') && !b.includes('Font') && !b.includes('PDF') && !b.includes('RGB') && !b.includes('endstream') && !b.includes('Widths'));

console.log('=== EXTRACTED REPORT BLOCKS ===');
console.log(cleanBlocks.join('\n'));
