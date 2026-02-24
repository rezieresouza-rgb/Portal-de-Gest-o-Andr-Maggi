
const fs = require('fs');
const path = require('path');

const downloadsDir = path.join('c:', 'Users', 'rezie', 'Downloads');
try {
    const files = fs.readdirSync(downloadsDir);
    const excelFiles = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

    const results = excelFiles.map(f => {
        const fullPath = path.join(downloadsDir, f);
        const stats = fs.statSync(fullPath);
        return { name: f, size: stats.size, lastModified: stats.mtime };
    });

    fs.writeFileSync('scripts/all_excel_files.json', JSON.stringify(results, null, 2));
    console.log('Excel file list saved to scripts/all_excel_files.json');
} catch (error) {
    console.error('Error:', error.message);
}
