
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('scripts/all_excel_files.json', 'utf8'));

const keywords = ['HABILI', 'ROTEIRO', 'MATRIZ', 'CURRICULO', 'BNCC'];

const matches = data.filter(f => {
    const name = f.name.toUpperCase();
    return keywords.some(k => name.includes(k));
});

fs.writeFileSync('scripts/subject_candidates_v2.json', JSON.stringify(matches, null, 2));
console.log(`Found ${matches.length} candidates.`);
matches.forEach(m => console.log(`- ${m.name} (${m.size} bytes)`));
