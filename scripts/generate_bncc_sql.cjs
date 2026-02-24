
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');
const outputSqlPath = path.join(__dirname, 'insert_bncc_full.sql');

try {
    const workbook = XLSX.readFile(filePath);
    const availableSheets = workbook.SheetNames;
    console.log('Available Sheets:', availableSheets);

    const sqlStatements = ['-- Script de inserção BNCC completa\n', 'DELETE FROM bncc_skills;\n'];
    let count = 0;

    availableSheets.forEach(sheetName => {
        // Pular abas que não são de disciplinas
        if (sheetName.includes('Competências') || sheetName.includes('Comentad') || sheetName.includes('Estrutura')) {
            return;
        }

        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Tentar identificar a disciplina
        let subject = sheetName.toUpperCase().trim();
        if (subject === 'LÍNGUA PORTUGUESA' || subject === 'PORTUGUÊS') subject = 'LÍNGUA PORTUGUESA';

        console.log(`Processing sheet: ${sheetName} as Subject: ${subject}`);

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 2) continue;

            // Procurar por células que pareçam habilidades: (EFxxXXxx)
            row.forEach(cell => {
                if (typeof cell === 'string') {
                    const match = cell.match(/^\((EF[0-9A-Z]+)\)\s*(.*)$/);
                    if (match) {
                        const code = match[1];
                        const description = match[2].replace(/'/g, "''");

                        // Determinar year_range
                        const yearRangeMatch = code.match(/^EF(\d{2})/);
                        const yearRange = yearRangeMatch ? `EF${yearRangeMatch[1]}` : 'EF00';

                        sqlStatements.push(`INSERT INTO bncc_skills (code, description, subject, year_range) VALUES ('${code}', '${description}', '${subject}', '${yearRange}') ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;\n`);
                        count++;
                    }
                }
            });
        }
    });

    fs.writeFileSync(outputSqlPath, sqlStatements.join(''));
    console.log(`Successfully generated SQL with ${count} skills at ${outputSqlPath}`);
} catch (error) {
    console.error('Error processing BNCC:', error.message);
}
