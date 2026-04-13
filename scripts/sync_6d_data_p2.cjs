const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'b514754e-5c4c-4e37-bb4b-aa445428fcf8'; // 6º ANO D

const studentsData = [
  { reg: "2671365", name: "JORGE HENRIQUE PEREIRA DE AZEVEDO", gender: "MASCULINO", birth: "2015-02-03", enroll: "2026-01-19" },
  { reg: "2671389", name: "JOYCE DE JESUS DOS SANTOS", gender: "FEMININO", birth: "2014-10-08", enroll: "2026-01-19" },
  { reg: "2287110", name: "LORANE DA SILVA BEZERRA", gender: "FEMININO", birth: "2014-04-16", enroll: "2026-01-19" },
  { reg: "2666258", name: "MARIANA BENICIO COSTA", gender: "MASCULINO", birth: "2015-02-03", enroll: "2026-01-19" },
  { reg: "2320081", name: "MATHEUS DE SOUZA FRANÇA", gender: "MASCULINO", birth: "2015-02-11", enroll: "2026-01-19" },
  { reg: "2289500", name: "PAOLLA LIMA DA SILVA", gender: "FEMININO", birth: "2014-10-16", enroll: "2026-01-19" },
  { reg: "2666437", name: "SAMUEL LEANDRO DO VALE", gender: "MASCULINO", birth: "2014-04-19", enroll: "2026-01-19" },
  { reg: "2339491", name: "TAKAKPYNEITI KABRAL METUKTIRE", gender: "MASCULINO", birth: "2014-09-04", enroll: "2026-01-19" },
  { reg: "2286447", name: "YAN SILVA NUNES", gender: "MASCULINO", birth: "2015-01-23", enroll: "2026-01-19" },
  { reg: "2328692", name: "BEPI METUKTIRE", gender: "MASCULINO", birth: "2013-05-06", enroll: "2026-02-10" },
  { reg: "2676647", name: "JOZIEU MATEUS SABINO DE OLIVEIRA", gender: "MASCULINO", birth: "2014-04-14", enroll: "2026-04-02" },
  { reg: "2732060", name: "CARLOS ANDRÉ PEREIRA MIGUINS", gender: "MASCULINO", birth: "2015-01-17", enroll: "2026-03-27" }
];

async function syncData() {
  console.log("Starting final data sync for 6th Grade D (Part 2)...");

  for (const s of studentsData) {
    console.log(`Syncing: ${s.name}...`);
    
    // Match by name first
    const { data: foundStudents } = await supabase
      .from('students')
      .select('id, name')
      .ilike('name', s.name);

    if (!foundStudents || foundStudents.length === 0) {
      console.warn(`  Student not found by name: ${s.name}. Trying by registration ${s.reg}...`);
      const { data: foundByReg } = await supabase
        .from('students')
        .select('id, name')
        .eq('registration_number', s.reg);
      
      if (foundByReg && foundByReg.length > 0) {
        await processStudent(foundByReg[0], s);
      } else {
        console.error(`  Student completely missing: ${s.name}`);
      }
    } else {
      await processStudent(foundStudents[0], s);
    }
  }

  async function processStudent(student, target) {
    const { error: studentError } = await supabase
      .from('students')
      .update({
        gender: target.gender,
        birth_date: target.birth,
        registration_number: target.reg,
        name: target.name
      })
      .eq('id', student.id);

    if (studentError) {
      console.error(`    Error updating students table:`, studentError.message);
    } else {
      console.log(`    ✓ Updated students table`);
    }

    const { error: enrollError } = await supabase
      .from('enrollments')
      .update({ enrollment_date: target.enroll })
      .eq('student_id', student.id)
      .eq('classroom_id', classroomId);

    if (enrollError) {
      console.error(`    Error updating enrollment:`, enrollError.message);
    } else {
      console.log(`    ✓ Updated enrollment date: ${target.enroll}`);
    }
  }

  console.log("Sync finished.");
}

syncData();
