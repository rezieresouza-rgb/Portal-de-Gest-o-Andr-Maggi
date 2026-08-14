const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:\\Users\\rezie\\Downloads\\2 - Ficha de Inspeções.docx.pdf');
let pos = 0;
let matchCount = 0;

while ((pos = buf.indexOf('stream', pos)) !== -1) {
  pos += 6;
  if (buf[pos] === 0x0d && buf[pos+1] === 0x0a) pos += 2;
  else if (buf[pos] === 0x0a) pos += 1;

  const endPos = buf.indexOf('endstream', pos);
  if (endPos !== -1) {
    const streamData = buf.slice(pos, endPos);
    try {
      const decompressed = zlib.inflateSync(streamData);
      const str = decompressed.toString('latin1');
      
      // Look for strings enclosed in parentheses
      const matches = str.match(/\(([^()]+)\)/g);
      if (matches && matches.length > 0) {
        const cleanText = matches
          .map(m => m.slice(1, -1))
          .filter(t => t.length > 1 && !t.startsWith('/'))
          .join(' ');
        
        if (cleanText.length > 5) {
          matchCount++;
          console.log(`\n--- DECOMPRESSED STREAM ${matchCount} ---`);
          console.log(cleanText);
        }
      }
    } catch (e) {
      // ignore non-zlib
    }
    pos = endPos + 9;
  } else {
    break;
  }
}

console.log(`Total decompressed text streams: ${matchCount}`);
