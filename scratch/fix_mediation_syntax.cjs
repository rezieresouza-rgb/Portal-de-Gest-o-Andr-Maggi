
const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\rezie\\Downloads\\portal-de-gestão-andré-maggi\\components\\MediationManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The specific pattern causing the build error:
const pattern = `                     </div>
                  </div>
                  </div>
                  <div className="flex flex-col gap-2">`;

const fix = `                     </div>
                  </div>
                  <div className="flex flex-col gap-2">`;

if (content.includes(pattern)) {
    content = content.replace(pattern, fix);
    fs.writeFileSync(filePath, content);
    console.log('Fixed syntax error in MediationManager.tsx');
} else {
    // Try to find it with potential CRLF issues
    const patternCRLF = pattern.replace(/\n/g, '\r\n');
    const fixCRLF = fix.replace(/\n/g, '\r\n');
    if (content.includes(patternCRLF)) {
        content = content.replace(patternCRLF, fixCRLF);
        fs.writeFileSync(filePath, content);
        console.log('Fixed syntax error (CRLF) in MediationManager.tsx');
    } else {
        console.log('Pattern not found. Checking content around line 330...');
        const lines = content.split(/\r?\n/);
        console.log('Line 331:', JSON.stringify(lines[331]));
        console.log('Line 332:', JSON.stringify(lines[332]));
        console.log('Line 333:', JSON.stringify(lines[333]));
    }
}
