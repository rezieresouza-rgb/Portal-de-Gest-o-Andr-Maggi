
const fs = require('fs');
const path = require('path');

const downloadsDir = path.join('c:', 'Users', 'rezie', 'Downloads');
try {
    const files = fs.readdirSync(downloadsDir);
    const bnccFiles = files.filter(f => f.toUpperCase().startsWith('BNCC'));

    const results = bnccFiles.map(f => {
        const fullPath = path.join(downloadsDir, f);
        const stats = fs.statSync(fullPath);
        return { name: f, size: stats.size, lastModified: stats.mtime, isDirectory: stats.isDirectory() };
    });

    fs.writeFileSync('scripts/bncc_files_list_all.json', JSON.stringify(results, null, 2));
    console.log('Comprehensive file list saved to scripts/bncc_files_list_all.json');
} catch (error) {
    console.error('Error:', error.message);
}
