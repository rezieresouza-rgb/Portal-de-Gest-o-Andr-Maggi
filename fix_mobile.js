const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'modules');
if (!fs.existsSync(modulesDir)) process.exit(1);

const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.tsx') && f !== 'TeacherModule.tsx');

for (const file of files) {
    const filePath = path.join(modulesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already processed
    if (content.includes('isSidebarOpen')) continue;

    console.log(`Processing ${file}...`);

    // 1. Add Menu, X to lucide-react imports if missing
    if (!content.includes('Menu,')) {
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+'lucide-react';/s, (match, p1) => {
            let vars = p1.split(',').map(s => s.trim()).filter(Boolean);
            if (!vars.includes('Menu')) vars.push('Menu');
            if (!vars.includes('X')) vars.push('X');
            return `import {\n  ${vars.join(',\n  ')}\n} from 'lucide-react';`;
        });
    }

    // 1.5 Add `useState` from React if not imported
    // But usually it is imported. We assume it is.

    // 2. Add state
    const componentMatch = content.match(/const\s+(\w+)(?::\s*React\.FC<[^>]+>)?\s*=\s*\(([^)]+)\)\s*=>\s*\{/);
    if (componentMatch) {
        const insertPos = content.indexOf('{', componentMatch.index) + 1;
        content = content.slice(0, insertPos) + '\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);' + content.slice(insertPos);
    }

    // 3. Update aside
    content = content.replace(/<aside\s+className="([^"]+w-64[^"]*)"([^>]*)>/, (match, classes, rest) => {
        const newClasses = classes.replace(/\bw-64\b/g, '').trim();
        return `<aside className={\`fixed lg:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform \${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${newClasses}\`}${rest}>`;
    });

    // 4. Update aside header (for mobile close button)
    content = content.replace(/<div className="p-6([^"]*)">\s*<h1/g, (match, p1) => {
        if (!p1.includes('flex')) {
            return `<div className="p-6 flex items-center justify-between${p1}">\n          <h1`;
        }
        return match;
    });

    // Find the closing </h1> of that first h1 and inject close button
    content = content.replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/, `$1\n          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/50 hover:text-white">\n            <X size={20} />\n          </button>`);

    // 5. Add backdrop after </aside>
    content = content.replace(/<\/aside>/, `</aside>\n\n      {/* Backdrop para mobile */}\n      {isSidebarOpen && (\n        <div\n          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"\n          onClick={() => setIsSidebarOpen(false)}\n        />\n      )}`);

    // 6. Fix main header (add padding and Menu button)
    const isDark = content.includes('bg-transparent border-b border-white/10') && !file.includes('Merenda') && !file.includes('Almoxarife');
    const btnClass = isDark ? "lg:hidden p-2.5 bg-white/10 text-white/70 hover:bg-white/20 rounded-xl border border-white/20 transition-colors mr-2" : "lg:hidden p-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200 transition-colors mr-2";

    let headerReplaced = false;
    content = content.replace(/<header\s+className="([^"]+px-10[^"]*)"([^>]*)>\s*<div\s+className="flex\s+items-center\s+gap-[^"]+"([^>]*)>/, (match, hClasses, hRest, divRest) => {
        headerReplaced = true;
        const newHClasses = hClasses.replace('px-10', 'px-4 lg:px-10');
        return `<header className="${newHClasses}"${hRest}>\n          <div className="flex items-center gap-4"${divRest}>\n            <button onClick={() => setIsSidebarOpen(true)} className="${btnClass}">\n              <Menu size={20} />\n            </button>`;
    });

    if (!headerReplaced) {
        content = content.replace(/<header className="([^"]*)\s*px-10\s*([^"]*)"/g, `<header className="$1 px-4 lg:px-10 $2"`);
        if (!content.includes('<Menu size={20} />') && content.includes('<header')) {
            content = content.replace(/(<header[^>]*>\s*<div[^>]*>)/, `$1\n            <button onClick={() => setIsSidebarOpen(true)} className="${btnClass}">\n              <Menu size={20} />\n            </button>`);
        }
    }

    // 7. Fix main padding
    content = content.replace(/<div className="flex-1 overflow-y-auto p-8 custom-scrollbar">/g, `<div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">`);

    // 8. Auto-close sidebar on tab click
    content = content.replace(/onClick=\{\(\) => setActiveTab\(([^)]+)\)\}/g, `onClick={() => { setActiveTab($1); setIsSidebarOpen(false); }}`);
    content = content.replace(/onClick=\{\(\) => setActiveSubTab\(([^)]+)\)\}/g, `onClick={() => { setActiveSubTab($1); setIsSidebarOpen(false); }}`);
    // Sometimes it's passed an event: e => setActiveTab
    content = content.replace(/onClick=\{\(e\) => setActiveTab\(([^)]+)\)\}/g, `onClick={(e) => { setActiveTab($1); setIsSidebarOpen(false); }}`);

    fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Done.');
