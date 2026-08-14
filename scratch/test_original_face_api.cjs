const path = require('path');
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function test() {
  console.log("Loading face detection model using original face-api.js...");
  const modelDir = path.join(__dirname, '../node_modules/@vladmandic/face-api/model');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
  console.log("✅ SSD MobileNet V1 model loaded successfully with original face-api.js!");
}

test();
