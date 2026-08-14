const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:\\Users\\rezie\\Downloads\\2 - Ficha de Inspeções.docx.pdf');
let pos = 0;
let streamCount = 0;

while ((pos = buf.indexOf('stream', pos)) !== -1) {
  pos += 6;
  if (buf[pos] === 0x0d && buf[pos+1] === 0x0a) pos += 2;
  else if (buf[pos] === 0x0a) pos += 1;

  const endPos = buf.indexOf('endstream', pos);
  if (endPos !== -1) {
    const streamData = buf.slice(pos, endPos);
    try {
      const decompressed = zlib.inflateSync(streamData);
      const str = decompressed.toString('utf8');
      // Look for text operators like Tj, TJ, ET, BT
      if (str.includes('Tj') || str.includes('TJ') || str.includes('Ficha') || str.includes('Inspe') || str.includes('SEDUC')) {
        streamCount++;
        console.log(`\n=== STREAM ${streamCount} ===`);
        // Clean stream text
        const clean = str.replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, ' ');
        console.log(clean);
      }
    } catch (e) {
      // not zlib compressed or raw image stream
    }
    pos = endPos + 9;
  } else {
    break;
  }
}

console.log(`Total text streams decompressed: ${streamCount}`);
