const fs = require('fs');

const manualText = fs.readFileSync('scratch/manual_seduc_2025_full_text.txt', 'utf8');

console.log('=== TABLE OF CONTENTS (SUMÁRIO) ===');
const sumarioStart = manualText.indexOf('SUMÁRIO');
if (sumarioStart !== -1) {
  console.log(manualText.substring(sumarioStart, sumarioStart + 3500));
}

// Search for Preventive Maintenance routines, categories and items
console.log('\n=== PREVENTIVE MAINTENANCE CATEGORIES & ROUTINES IN MANUAL ===');
const lines = manualText.split('\n');
const headings = lines.filter(l => 
  /^\d+\.\s+[A-Z]/.test(l.trim()) || 
  /^\d+\.\d+\s+[A-Z]/.test(l.trim()) ||
  l.includes('Cronograma') ||
  l.includes('Periodicidade') ||
  l.includes('Manutenção Preventiva')
);

console.log(headings.slice(0, 50).join('\n'));
