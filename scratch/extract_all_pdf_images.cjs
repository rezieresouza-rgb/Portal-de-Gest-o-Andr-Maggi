const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfPath = 'C:\\Users\\rezie\\Downloads\\2 - Ficha de Inspeções.docx.pdf';
const outDir = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\4f7f5325-f00b-4d50-9e2f-329bf8e558d4';

const buf = fs.readFileSync(pdfPath);

// Search for all FlateDecode image streams (ColorSpace /DeviceRGB or /DeviceGray, Width, Height)
let pos = 0;
let imgCount = 0;

while ((pos = buf.indexOf('/Subtype /Image', pos)) !== -1) {
  const objStart = buf.lastIndexOf('obj', pos);
  const streamPos = buf.indexOf('stream', pos);
  const endStreamPos = buf.indexOf('endstream', streamPos);

  if (streamPos !== -1 && endStreamPos !== -1) {
    let rawStream = buf.slice(streamPos + 6, endStreamPos);
    if (rawStream[0] === 0x0d && rawStream[1] === 0x0a) rawStream = rawStream.slice(2);
    else if (rawStream[0] === 0x0a) rawStream = rawStream.slice(1);

    // Extract width and height from dict
    const dictText = buf.slice(objStart, streamPos).toString('utf8');
    const widthMatch = dictText.match(/\/Width\s+(\d+)/);
    const heightMatch = dictText.match(/\/Height\s+(\d+)/);

    const width = widthMatch ? parseInt(widthMatch[1]) : 0;
    const height = heightMatch ? parseInt(heightMatch[1]) : 0;

    let uncompressed;
    try {
      uncompressed = zlib.inflateSync(rawStream);
    } catch (e) {
      uncompressed = rawStream;
    }

    imgCount++;
    console.log(`Image ${imgCount}: Width=${width}, Height=${height}, RawSize=${rawStream.length}, UncompressedSize=${uncompressed.length}`);

    // If it's raw RGB or RGBA data, we can build a PPM or PNG or write raw
    if (width > 0 && height > 0) {
      const ppmHeader = Buffer.from(`P6\n${width} ${height}\n255\n`);
      let ppmBuf;
      if (uncompressed.length >= width * height * 3) {
        ppmBuf = Buffer.concat([ppmHeader, uncompressed.slice(0, width * height * 3)]);
        const outPpm = path.join(outDir, `pdf_page_image_${imgCount}.ppm`);
        fs.writeFileSync(outPpm, ppmBuf);
        console.log(`Saved PPM: ${outPpm}`);
      }
    }

    pos = endStreamPos + 9;
  } else {
    pos += 15;
  }
}

console.log(`Total images processed: ${imgCount}`);
