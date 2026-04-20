const fs = require('fs');
const path = 'c:/Users/rezie/Downloads/portal-de-gestão-andré-maggi/components/BuscaAtivaStudentProfile.tsx';
let content = fs.readFileSync(path, 'utf8');

// Use regex for robust replacement
content = content.replace(
  /!item\.isOccurrence && \(item\.original as any\)\.feedback/g, 
  '!item.isOccurrence && (item.original as any)?.feedback'
);

content = content.replace(
  /"{ \(item\.original as any\)\.feedback }"/g, 
  '"{ (item.original as any)?.feedback }"'
);

fs.writeFileSync(path, content);
console.log('BuscaAtivaStudentProfile.tsx repaired successfully.');
