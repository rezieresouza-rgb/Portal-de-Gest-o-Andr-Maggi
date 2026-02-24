
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const file = { name: 'Ensino Fundamental', path: path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx') };

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

const subjectMapping = {
    'PORTU': 'LÍNGUA PORTUGUESA',
    'HISTO': 'HISTÓRIA',
    'GEOGRA': 'GEOGRAFIA',
    'CIENC': 'CIÊNCIAS',
    'MATEM': 'MATEMÁTICA',
    'ARTE': 'ARTE',
    'FISIC': 'EDUCAÇÃO FÍSICA',
    'INGLE': 'LÍNGUA INGLESA',
    'RELIGIO': 'ENSINO RELIGIOSO'
};

try {
    const workbook = XLSX.readFile(file.path);
    let map = [];

    workbook.SheetNames.forEach((name, idx) => {
        const sheet = workbook.Sheets[name];
        if (!sheet['!ref']) return;
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let detected = "OUTROS";
        let skillCount = 0;

        // Look for subject in sheet name first
        const normName = normalize(name);
        for (const [key, val] of Object.entries(subjectMapping)) {
            if (normName.includes(key)) {
                detected = val;
                break;
            }
        }

        // If not found in name, look in the first 10 rows
        if (detected === "OUTROS") {
            for (let i = 0; i < Math.min(data.length, 10); i++) {
                const rowStr = JSON.stringify(data[i] || "");
                for (const [key, val] of Object.entries(subjectMapping)) {
                    if (normalize(rowStr).includes(key)) {
                        detected = val;
                        break;
                    }
                }
                if (detected !== "OUTROS") break;
            }
        }

        // Count skills using regex
        data.forEach(row => {
            if (!row) return;
            row.forEach(cell => {
                if (typeof cell === 'string' && cell.match(/EF\d{2}[A-Z]{2}\d{2}/i)) {
                    skillCount++;
                }
            });
        });

        map.push({ index: idx, name: name, detectedSubject: detected, count: skillCount });
    });

    fs.writeFileSync('scripts/subject_map.json', JSON.stringify(map, null, 2));
    console.log('Mapping completed. Check scripts/subject_map.json');
} catch (error) {
    console.error('Erro:', error.message);
}
