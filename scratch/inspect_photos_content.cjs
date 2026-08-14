const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const artifactBase = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69';
const srcPhotosDir = path.join(artifactBase, 'photos_escolas');

async function inspectPhotos() {
  const files = fs.readdirSync(srcPhotosDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`Analyzing skin/people presence across ${files.length} photos...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const srcPath = path.join(srcPhotosDir, file);

    const img = await loadImage(srcPath);
    const canvas = createCanvas(300, Math.round((img.height * 300) / img.width));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let skinCount = 0;
    const totalPixels = canvas.width * canvas.height;

    for (let p = 0; p < data.length; p += 4) {
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      if (r > 60 && g > 35 && b > 20 && (Math.max(r, g, b) - Math.min(r, g, b) > 15) && Math.abs(r - g) > 15 && r > g && r > b) {
        skinCount++;
      }
    }

    const skinRatio = ((skinCount / totalPixels) * 100).toFixed(1);
    if (parseFloat(skinRatio) > 2.0) {
      console.log(`Photo ${i + 1} (${file}): ${skinRatio}% skin pixels -> HAS PEOPLE!`);
    }
  }
}

inspectPhotos();
