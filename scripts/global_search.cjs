
const fs = require('fs');
const path = require('path');

const keywords = [/religio/i, /pratica.*experimen/i, /projeto.*vida/i];
const ignoreDirs = ['.git', 'node_modules', '.gemini', 'brain', 'dist', '.next'];

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (ignoreDirs.some(id => fullPath.includes(id))) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchDir(fullPath);
        } else if (stat.isFile()) {
            // Check if it's a text-like file
            if (/\.(tsx|ts|js|jsx|json|md|sql|html|css|txt|cjs)$/i.test(file)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                keywords.forEach(kw => {
                    if (kw.test(content)) {
                        console.log(`MATCH [${kw}] in: ${fullPath}`);
                        // Find line number
                        const lines = content.split('\n');
                        lines.forEach((line, idx) => {
                            if (kw.test(line)) {
                                console.log(`  L${idx + 1}: ${line.trim()}`);
                            }
                        });
                    }
                });
            }
        }
    }
}

console.log('--- Starting Global String Search ---');
searchDir('.');
console.log('--- Search Finished ---');
