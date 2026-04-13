const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '65988e66-36c6-41b6-988c-60892c5c8053'; // 6º ANO A

const names = [
  'BEPIET PANARA METUKTIRE', 'DAVI LUCAS LIMA RODRIGUES', 'EMILY CRISTINA DO NASCIMENTO',
  'ENZO ARTHUR DA SILVA SANTOS', 'GUSTAVO HENRIQUE DE PAULA DE LARA', 'ISADORA CAETANO MATEUS',
  'JASMIM RAFAELA AMÂNCIO DE LIMA', 'JOÃO LUCAS DE SOUZA DA SILVA', 'LEONEL FELIPE OLIVEIRA DOS SANTOS',
  'MIKAELY TIBURCIO SILVA', 'PAULA FERNANDA COIMBRA DA SILVA', 'SABRINA VITORIA MATIAS MARTINS',
  'WELBER LERRANDRO LOPES APARECIDO', 'FERNANDO DJARA TXUCARRAMÃE'
];

async function cleanup() {
  console.log("Cleaning up duplicate student records for 6th Grade A...");

  for (const n of names) {
    const { data: students } = await supabase.from('students').select('id, name, registration_number').ilike('name', n);
    
    if (students && students.length > 1) {
      console.log(`Processing duplicates for: ${n}`);
      
      const ids = students.map(s => s.id);
      
      // Check which IDs are enrolled in 6A
      const { data: enrollments } = await supabase.from('enrollments').select('student_id, classroom_id').in('student_id', ids);
      
      const enrolledIn6A = enrollments.filter(e => e.classroom_id === classroomId).map(e => e.student_id);
      const enrolledOthers = enrollments.filter(e => e.classroom_id !== classroomId).map(e => e.student_id);
      
      console.log(`  Total IDs: ${ids.length}`);
      console.log(`  Enrolled in 6A: ${enrolledIn6A.length}`);
      
      if (enrolledIn6A.length === 1) {
        const keepId = enrolledIn6A[0];
        const deleteIds = ids.filter(id => id !== keepId);
        
        // Before deleting, ensure deleteIds are not enrolled elsewhere
        const safeToDelete = deleteIds.filter(id => !enrolledOthers.includes(id));
        
        if (safeToDelete.length > 0) {
          console.log(`  Deleting ghost IDs: ${safeToDelete.length}`);
          const { error } = await supabase.from('students').delete().in('id', safeToDelete);
          if (error) console.error(`  Error deleting for ${n}:`, error.message);
          else console.log(`  ✓ Successfully cleaned up ${n}`);
        } else {
          console.warn(`  ⚠️ Could not safely delete duplicates for ${n} (enrolled in other classes)`);
        }
      } else if (enrolledIn6A.length === 0) {
        console.warn(`  ⚠️ None of the ${ids.length} records for ${n} are enrolled in 6A!`);
      } else {
        console.warn(`  ⚠️ Multiple records for ${n} are enrolled in 6A! Consolidate manually.`);
      }
    }
  }
}

cleanup();
