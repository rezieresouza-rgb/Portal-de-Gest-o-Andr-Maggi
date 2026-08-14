const fs = require('fs');
const crypto = require('crypto');

// Polyfill ArrayBuffer & Uint8Array toHex
ArrayBuffer.prototype.toHex = function() {
  return Buffer.from(this).toString('hex');
};
Uint8Array.prototype.toHex = function() {
  return Buffer.from(this).toString('hex');
};

if (!globalThis.crypto) {
  globalThis.crypto = {};
}
globalThis.crypto.subtle = {
  digest: async (algo, data) => {
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(data));
    const buf = hash.digest();
    buf.toHex = () => buf.toString('hex');
    return buf;
  }
};

if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

async function main() {
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  const buf = fs.readFileSync('C:\\Users\\rezie\\Downloads\\2 - Ficha de Inspeções.docx.pdf');
  const uint8 = new Uint8Array(buf);
  
  const loadingTask = pdfjs.getDocument({
    data: uint8,
    useSystemFonts: true,
    isEvalSupported: false
  });
  
  const doc = await loadingTask.promise;
  console.log('=== SUCCESS! TOTAL PAGES ===:', doc.numPages);
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    console.log(`\n================ PAGE ${i} ================`);
    console.log(pageText);
  }
}

main().catch(console.error);
