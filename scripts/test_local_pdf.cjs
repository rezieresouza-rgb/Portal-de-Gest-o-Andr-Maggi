
const fs = require('fs');
const pdf = require('pdf-parse');

async function extractText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    console.log(`\n=== FILE: ${filePath} ===`);
    console.log(data.text);
  } catch (err) {
    console.error(`ERROR:`, err.message);
  }
}

extractText('test_janeiro.pdf');
