
import fs from 'fs';

const text = fs.readFileSync('bank_text_results_v3.txt', 'utf8');
const lines = text.split('\n');

const results = [];
const regex = /(\d+[\.,]\d{2})/g;

lines.forEach(line => {
    const matches = line.match(regex);
    if (matches) {
        matches.forEach(m => {
            const val = parseFloat(m.replace('.', '').replace(',', '.'));
            if (val > 1000) {
                results.push(`[Line] ${line.trim()}`);
            }
        });
    }
});

fs.writeFileSync('filtered_transactions.txt', results.join('\n'));
console.log(`Found ${results.length} large transactions. Saved to filtered_transactions.txt`);
