const path = require('path');
const util = require('util');
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

const faceapi = require('@vladmandic/face-api/dist/face-api.js');
const { Canvas, Image, ImageData } = require('canvas');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function test() {
  console.log("Loading face detection model using web bundle...");
  const modelDir = path.join(__dirname, '../node_modules/@vladmandic/face-api/model');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
  console.log("✅ SSD MobileNet V1 model loaded successfully!");
}

test();
