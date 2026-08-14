const fs = require('fs');
const path = require('path');

const artifactBase = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69';
const blurredPhotosDir = path.join(artifactBase, 'photos_escolas_blurred');

if (fs.existsSync(blurredPhotosDir)) {
  const files = fs.readdirSync(blurredPhotosDir);
  console.log(`Blurred photos saved so far: ${files.length} of 62`);
} else {
  console.log("Blurred folder not created yet.");
}
