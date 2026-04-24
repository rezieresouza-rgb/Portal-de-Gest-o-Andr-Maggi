const fs = require('fs');
const files = fs.readdirSync('./components').filter(f => f.endsWith('.tsx'));
files.forEach(f => {
  const content = fs.readFileSync('./components/' + f, 'utf-8');
  if (content.includes('ShieldCheck') && (!content.includes('import') || !content.match(/import\s*{[^}]*ShieldCheck[^}]*}\s*from\s*['"]lucide-react['"]/))) {
    console.log(f);
  }
});
