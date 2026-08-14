const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const artifactBase = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69';
const srcMedia = path.join(artifactBase, 'media__1785538002006.png');
const targetAerial = path.join(artifactBase, 'foto_aerea_google_earth.jpg');

async function extractAerial() {
  const img = await loadImage(srcMedia);
  console.log(`Original image size: ${img.width}x${img.height}`);

  // In 1920x1080 resolution, the satellite photo is centered in the Word document.
  // Crop coordinates for the main aerial image inside Word:
  // x: 24% to 77%, y: 30% to 76%
  const cropX = Math.floor(img.width * 0.24);
  const cropY = Math.floor(img.height * 0.30);
  const cropW = Math.floor(img.width * 0.53);
  const cropH = Math.floor(img.height * 0.46);

  const canvas = createCanvas(cropW, cropH);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
  fs.writeFileSync(targetAerial, buffer);

  console.log(`✅ Extracted aerial photo to: ${targetAerial}`);
}

extractAerial();
