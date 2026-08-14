const { execSync } = require('child_process');

try {
  console.log("Checking Python version...");
  const pyVer = execSync('python --version').toString().trim();
  console.log("Python version:", pyVer);

  console.log("Checking / installing opencv-python...");
  execSync('python -m pip install opencv-python Pillow numpy');
  console.log("OpenCV installed successfully!");
} catch (err) {
  console.error("Error with python/pip:", err.message);
}
