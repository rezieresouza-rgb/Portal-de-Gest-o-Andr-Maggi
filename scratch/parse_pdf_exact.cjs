const fs = require('fs');

if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

async function main() {
  const pdfjs = await import('pdfjs-dist');
  const buf = fs.readFileSync('C:\\Users\\rezie\\Downloads\\2 - Ficha de Inspeções.docx.pdf');
  const uint8 = new Uint8Array(buf);
  const loadingTask = pdfjs.getDocument({ data: uint8 });
  const doc = await loadingTask.promise;
  console.log('=== TOTAL PAGES ===', doc.numPages);
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    console.log(`\n--- PAGE ${i} ---`);
    console.log(text);
  }
}

main().catch(console.error);
