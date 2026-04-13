const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'b514754e-5c4c-4e37-bb4b-aa445428fcf8'; // 6º ANO D

const studentsData = [
  { reg: "2666214", name: "ADRIEL COSTA GONÇALO", gender: "MASCULINO", birth: "2014-07-03", enroll: "2026-01-19" },
  { reg: "2667226", name: "AKEMILLY MARIA BALDAIA PAIM", gender: "FEMININO", birth: "2014-04-11", enroll: "2026-01-19" },
  { reg: "2286535", name: "ALLISON VICTOR DOS SANTOS PORTO", gender: "MASCULINO", birth: "2014-11-05", enroll: "2026-01-19" },
  { reg: "2667251", name: "ARTHUR DE LIMA SANCHES", gender: "MASCULINO", birth: "2015-01-05", enroll: "2026-01-19" },
  { reg: "2666110", name: "DAVY HENRIQUE BACHIEGA COSTA", gender: "MASCULINO", birth: "2014-09-15", enroll: "2026-01-19" },
  { reg: "2289783", name: "ELOIZA DE SOUZA DIAS", gender: "FEMININO", birth: "2014-09-30", enroll: "2026-01-19" },
  { reg: "2683198", name: "ENZO VINICIOS ALMONDES DE LIMA", gender: "MASCULINO", birth: "2014-07-09", enroll: "2026-01-19" },
  { reg: "2208519", name: "ESTER SANTANA RODRIGUES SANTOS", gender: "FEMININO", birth: "2013-07-24", enroll: "2026-01-19" },
  { reg: "2699492", name: "FELIPE GERMANO BENTO DA SILVA", gender: "MASCULINO", birth: "2014-06-19", enroll: "2026-01-19" },
  { reg: "2666394", name: "GABRIEL PLACEDINO TREVIZAN", gender: "FEMININO", birth: "2014-05-29", enroll: "2026-01-19" },
  { reg: "2368034", name: "GABRIELI MARTINS LIMA", gender: "FEMININO", birth: "2015-01-23", enroll: "2026-01-19" },
  { reg: "2323714", name: "GABRIELLY CORREIA DOS SANTOS", gender: "FEMININO", birth: "2014-05-26", enroll: "2026-01-19" },
  { reg: "2459053", name: "GUSTTAVO HENRIQUE DA COSTA SOUZA", gender: "MASCULINO", birth: "2014-07-03", enroll: "2026-01-19" },
  { reg: "2716602", name: "HENRRY GABRIEL CARDOSO DORIA", gender: "MASCULINO", birth: "2014-08-22", enroll: "2026-01-19" },
  { reg: "2709916", name: "HIAGO BRUNO ARAUJO DE ALMEIDA", gender: "MASCULINO", birth: "2014-01-15", enroll: "2026-01-19" },
  { reg: "2671289", name: "HIAXLLEY VICTOR PAULINO BISPO", gender: "MASCULINO", birth: "2014-12-02", enroll: "2026-01-19" },
  { reg: "2305802", name: "JEAN PAULO SOARES DE OLIVEIRA", gender: "MASCULINO", birth: "2014-05-02", enroll: "2026-01-19" },
  { reg: "2666421", name: "JEFERSON TARIFA DOS SANTOS", gender: "MASCULINO", birth: "2014-08-26", enroll: "2026-01-19" },
  { reg: "2666169", name: "JOÃO MIGUEL JESUS ARAUJO THOME", gender: "MASCULINO", birth: "2014-04-04", enroll: "2026-01-19" },
  { reg: "2666296", name: "JOÃO VITOR DOS SANTOS MATEUS", gender: "MASCULINO", birth: "2014-11-18", enroll: "2026-01-19" }
];

async function syncData() {
  console.log("Starting data sync for 6th Grade D (Part 1)...");

  for (const s of studentsData) {
    // Find the student by registration number FIRST (since I cleaned up based on this logic)
    // Actually, I'll match by name to handle reg typos, but reg is safer if names are being corrected.
    // Let's try name match since registration numbers were being fixed.
    
    console.log(`Syncing: ${s.name}...`);
    
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
    // Update basic student data
    const { error: studentError } = await supabase
      .from('students')
      .update({
        gender: target.gender,
        birth_date: target.birth,
        registration_number: target.reg,
        name: target.name // Correct spelling
      })
      .eq('id', student.id);

    if (studentError) {
      console.error(`    Error updating students table:`, studentError.message);
    } else {
      console.log(`    ✓ Updated students table`);
    }

    // Update enrollment date
    const { error: enrollError } = await supabase
      .from('enrollments')
      .update({ enrollment_date: target.enroll })
      .eq('student_id', student.id)
      .eq('classroom_id', classroomId);

    if (enrollError) {
      console.error(`    Error updating enrollment:`, enrollError.message);
    } else {
      console.log(`    ✓ Updated enrollment date`);
    }
  }

  console.log("Sync finished.");
}

syncData();
