const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'modules', 'GamificationModule.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// Fix buttons
content = content.replace(
  /activeTab ==='auditoria'\? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'/,
  "activeTab === 'pontos_manuais' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
);

content = content.replace(
  /onClick=\{\(\) => setActiveTab\('auditoria'\)\}\n\s*className=\{`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap \$\{\n\s*activeTab === 'pontos_manuais'/,
  `onClick={() => setActiveTab('pontos_manuais')}
            className={\`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap \${
              activeTab === 'pontos_manuais'`
);

// Fix tab content
content = content.replace(
  /\{activeTab ==='auditoria'&& \(\n\s*<div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center animate-in fade-in max-w-2xl mx-auto mt-8 print:hidden">/,
  `{activeTab === 'pontos_manuais' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center animate-in fade-in max-w-2xl mx-auto mt-8 print:hidden">`
);

content = content.replace(/activeTab ==='auditoria'/g, "activeTab === 'auditoria'");

fs.writeFileSync(filepath, content, 'utf8');
console.log('Fixed again');
