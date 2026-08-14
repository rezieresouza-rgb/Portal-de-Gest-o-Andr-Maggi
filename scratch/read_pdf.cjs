const fs = require('fs');

try {
  const pdfBuffer = fs.readFileSync('C:\\Users\\rezie\\Downloads\\2 - Ficha de Inspeções.docx.pdf');
  const pdfText = pdfBuffer.toString('binary');

  // Extract text enclosed in parens or readable text
  const strings = [];
  const regex = /\(([^()]{2,})\)/g;
  let match;
  while ((match = regex.exec(pdfText)) !== null) {
    strings.push(match[1]);
  }

  console.log('--- EXTRACTED STRINGS FROM PDF ---');
  console.log(strings.join('\n'));
} catch (e) {
  console.error(e);
}
