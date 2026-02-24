
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const EF_FILE = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

try {
    const workbook = XLSX.readFile(EF_FILE);
    let detail = [];

    workbook.SheetNames.forEach((name, idx) => {
        const sheet = workbook.Sheets[name];
        if (!sheet['!ref']) return;
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let codes = new Set();
        data.forEach(row => {
            if (!row) return;
            row.forEach(cell => {
                if (typeof cell === 'string') {
                    const match = cell.match(/\(?((EF0[6-9]|EF[6-9][6-9])[A-Z0-9]{2,})\)?/i);
                    if (match) codes.add(match[1].toUpperCase());
                }
            });
        });

        if (codes.size > 0) {
            detail.push({ index: idx, name: name, uniqueCodes: codes.size, sample: Array.from(codes).slice(0, 3) });
        }
    });

    fs.writeFileSync('scripts/detail_scan.json', JSON.stringify(detail, null, 2));
    console.log('Detail scan completed.');
} catch (error) {
    console.error('Error:', error.message);
}
