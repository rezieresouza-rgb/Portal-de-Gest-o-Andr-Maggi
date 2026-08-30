const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\rezie\\.gemini\\antigravity\\brain\\fba309ea-1c04-4eee-b5ba-2c39348eef86\\scratch\\parsed_sydle_paf.txt', 'utf-8');

// Split by pages
const pages = raw.split(/-- \d+ of 29 --/);
console.log('Pages count:', pages.length);

pages.forEach((p, idx) => {
  console.log(`\n================= PAGE ${idx + 1} =================`);
  console.log(p.trim().substring(0, 400));
});
