const fs = require('fs');

if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

async function extractInfo() {
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  const buf = fs.readFileSync('C:\\Users\\rezie\\Downloads\\2 - Ficha de Inspeções.docx.pdf');
  const uint8 = new Uint8Array(buf);
  const loadingTask = pdfjs.getDocument({ data: uint8, useSystemFonts: true });
  const doc = await loadingTask.promise;
  console.log('PDF loaded. Num pages:', doc.numPages);

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const str = content.items.map(it => it.str).join(' ');
    console.log(`\n=== PAGE ${i} TEXT (${content.items.length} items) ===`);
    console.log(str);
  }
}

extractInfo().catch(console.error);
