const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../node_modules/@vladmandic/face-api/dist');
console.log("Files in dist:", fs.readdirSync(distDir));
