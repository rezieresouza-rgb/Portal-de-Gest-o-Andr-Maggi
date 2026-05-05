const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function parseInitialStudents() {
    const content = fs.readFileSync(path.join(__dirname, '../constants/initialData.ts'), 'utf-8');
    // Find everything between INITIAL_STUDENTS = [ and ];
    const match = content.match(/export const INITIAL_STUDENTS = (\[[\s\S]*?\]);/);
    if (!match) return [];
    
    // Very basic extraction of Turma names from the raw string to avoid eval issues
    const students = [];
    const entryRegex = /Turma: "(.*?)"/g;
    let entry;
    while ((entry = entryRegex.exec(match[1])) !== null) {
        students.push({ Turma: entry[1] });
    }
    return students;
}

async function auditAllClasses() {
  console.log("=== GLOBAL STUDENT AUDIT ===");
  const initialStudents = parseInitialStudents();
  
  const { data: classrooms } = await supabase.from('classrooms').select('id, name').order('name');
  
  const { data: allEnrollments } = await supabase
    .from('enrollments')
    .select('classroom_id, status')
    .in('status', ['ATIVO', 'RECLASSIFICADO']);

  console.log(`\n${'CLASS'.padEnd(15)} | ${'DB (ACTIVE)'.padEnd(12)} | ${'INITIAL_DATA'.padEnd(12)} | ${'STATUS'.padEnd(10)}`);
  console.log("-".repeat(60));

  classrooms.forEach(cls => {
    const dbCount = allEnrollments.filter(e => e.classroom_id === cls.id).length;
    
    // Match by exact name or if the legacy name contains the new name
    const initialCount = initialStudents.filter(s => 
        s.Turma.toUpperCase().includes(cls.name.toUpperCase()) || 
        cls.name.toUpperCase().includes(s.Turma.toUpperCase())
    ).length;
    
    const diff = dbCount - initialCount;
    const status = diff === 0 ? "OK" : (diff > 0 ? `+${diff} NOVO` : `${diff} REMOVIDO`);

    console.log(`${cls.name.padEnd(15)} | ${dbCount.toString().padEnd(12)} | ${initialCount.toString().padEnd(12)} | ${status}`);
  });
  
  console.log("\nNota: Se INITIAL_DATA for 0, pode ser uma falha no script de auditoria ao ler o arquivo .ts, mas os dados do DB (ACTIVE) são extraídos diretamente do Supabase.");
}

auditAllClasses();
