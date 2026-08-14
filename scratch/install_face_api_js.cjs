const { execSync } = require('child_process');

try {
  console.log("Installing original face-api.js...");
  execSync('npm install face-api.js');
  console.log("face-api.js installed successfully!");
} catch (e) {
  console.error("Install error:", e.message);
}
