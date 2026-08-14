const path = require('path');
const fs = require('fs');

const base = path.join(__dirname, '../node_modules/@vladmandic/face-api');
console.log("Checking @vladmandic/face-api contents...");

if (fs.existsSync(base)) {
  console.log(fs.readdirSync(base));
  const modelDir = path.join(base, 'model');
  if (fs.existsSync(modelDir)) {
    console.log("Model dir files:", fs.readdirSync(modelDir));
  } else {
    console.log("Model dir does not exist in package root.");
  }
}
