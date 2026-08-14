const path = require('path');
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');
const { Canvas, Image, ImageData } = require('canvas');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function test() {
  console.log("Loading face detection model using node-wasm bundle...");
  const modelDir = path.join(__dirname, '../node_modules/@vladmandic/face-api/model');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
  console.log("✅ SSD MobileNet V1 model loaded successfully!");
}

test();
