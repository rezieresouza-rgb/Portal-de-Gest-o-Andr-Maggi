const fs = require('fs');
const path = require('path');

const pdfPath = 'C:\\Users\\rezie\\Downloads\\2 - Ficha de Inspeções.docx.pdf';
const outDir = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\4f7f5325-f00b-4d50-9e2f-329bf8e558d4';

const buf = fs.readFileSync(pdfPath);
let count = 0;

let pos = 0;
while (pos < buf.length - 4) {
  // Check for JPEG SOI marker (0xFF, 0xD8, 0xFF)
  if (buf[pos] === 0xFF && buf[pos+1] === 0xD8 && buf[pos+2] === 0xFF) {
    // Find EOI marker (0xFF, 0xD9)
    let endPos = pos + 3;
    while (endPos < buf.length - 1) {
      if (buf[endPos] === 0xFF && buf[endPos+1] === 0xD9) {
        endPos += 2;
        break;
      }
      endPos++;
    }

    if (endPos > pos + 100) {
      const imgBuf = buf.slice(pos, endPos);
      count++;
      const outPath = path.join(outDir, `pdf_extracted_page_${count}.jpg`);
      fs.writeFileSync(outPath, imgBuf);
      console.log(`Saved extracted image ${count}: ${outPath} (${imgBuf.length} bytes)`);
      pos = endPos;
      continue;
    }
  }
  pos++;
}

console.log(`Total JPEG images extracted: ${count}`);
