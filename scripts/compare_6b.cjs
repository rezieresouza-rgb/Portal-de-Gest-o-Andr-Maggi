const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Read INITIAL_STUDENTS from constant file (simulated)
const initialDataContent = fs.readFileSync(path.join(__dirname, '../constants/initialData.ts'), 'utf-8');

// Simplified parser for INITIAL_STUDENTS
function parseInitialStudents(content) {
    const startIdx = content.indexOf('export const INITIAL_STUDENTS: any[] = [');
    if (startIdx === -1) return [];
    
    // Find the matching closing bracket
    let bracketCount = 0;
    let endIdx = -1;
    for (let i = startIdx + 'export const INITIAL_STUDENTS: any[] = '.length; i < content.length; i++) {
        if (content[i] === '[') bracketCount++;
        if (content[i] === ']') {
            bracketCount--;
            if (bracketCount === 0) {
                endIdx = i;
                break;
            }
        }
    }
    
    if (endIdx === -1) return [];
    
    const arrayStr = content.substring(startIdx + 'export const INITIAL_STUDENTS: any[] = '.length, endIdx + 1);
    // Remove comments and clean up for eval
    const cleanStr = arrayStr.replace(/\/\/.*$/gm, '');
    try {
        return eval(cleanStr);
    } catch (e) {
        console.error("Eval failed", e);
        return [];
    }
}

const initialStudents = parseInitialStudents(initialDataContent);

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function compareLists() {
  const { data: classrooms } = await supabase.from('classrooms').select('id').eq('name', '6º ANO B');
  if (!classrooms || classrooms.length === 0) {
      console.log("6º ANO B not found in classrooms table");
      return;
  }
  const classroomId = classrooms[0].id;

  const { data: dbEnrollments } = await supabase
    .from('enrollments')
    .select('students(name)')
    .eq('classroom_id', classroomId)
    .in('status', ['ATIVO', 'RECLASSIFICADO']);

  const dbNames = dbEnrollments.map(e => e.students.name.toUpperCase().trim());
  const initial6B = initialStudents
    .filter(s => s.Turma === '6º ANO B')
    .map(s => s.Nome.toUpperCase().trim());

  console.log(`INITIAL_STUDENTS (6B): ${initial6B.length}`);
  console.log(`DB Students (6B): ${dbNames.length}`);

  console.log("\n=== Names in INITIAL_STUDENTS (6B) but NOT in DB ===");
  initial6B.forEach(name => {
    if (!dbNames.includes(name)) console.log(`- ${name}`);
  });

  console.log("\n=== Names in DB (6B) but NOT in INITIAL_STUDENTS ===");
  dbNames.forEach(name => {
    if (!initial6B.includes(name)) console.log(`+ ${name}`);
  });
}

compareLists();
