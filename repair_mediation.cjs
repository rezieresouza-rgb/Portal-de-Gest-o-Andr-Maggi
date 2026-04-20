const fs = require('fs');
const content = fs.readFileSync('c:/Users/rezie/Downloads/portal-de-gestão-andré-maggi/components/MediationManager.tsx', 'utf8').split('\n');

// Part 1: up to line 320 (index 319)
const part1 = content.slice(0, 320);
// Add the missing closing tag
part1.push('                   </button>');

// Part 2: resume from line 2312 (index 2311)
const part2 = content.slice(2311);

const finalContent = part1.concat(part2).join('\n');
fs.writeFileSync('c:/Users/rezie/Downloads/portal-de-gestão-andré-maggi/components/MediationManager.tsx', finalContent);
console.log('MediationManager.tsx repaired successfully.');
