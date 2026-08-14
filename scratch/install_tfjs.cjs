const { execSync } = require('child_process');

try {
  console.log("Installing @tensorflow/tfjs...");
  execSync('npm install @tensorflow/tfjs');
  console.log("tfjs installed successfully!");
} catch (e) {
  console.error("TFJS install error:", e.message);
}
