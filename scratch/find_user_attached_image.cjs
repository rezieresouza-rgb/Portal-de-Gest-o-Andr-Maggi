const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69';

function searchFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(searchFiles(filePath));
    } else {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        results.push({ path: filePath, mtime: stat.mtime });
      }
    }
  });
  return results;
}

const images = searchFiles(brainDir);
images.sort((a, b) => b.mtime - a.mtime);
console.log("Recent images in brain dir:");
images.slice(0, 10).forEach(img => console.log(img.path, img.mtime));
