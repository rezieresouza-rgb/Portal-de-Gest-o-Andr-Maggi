const { execSync } = require('child_process');

try {
  console.log("Installing sharp / jimp for image blurring...");
  execSync('npm install sharp jimp @vladmandic/face-api canvas');
  console.log("Packages installed successfully!");
} catch (e) {
  console.log("Fallback npm install sharp jimp:", e.message);
  try {
    execSync('npm install jimp');
    console.log("Installed jimp!");
  } catch (err2) {
    console.error("Jimp install error:", err2.message);
  }
}
