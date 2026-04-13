const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  try {
    // 1. Get 6º ANO B ID
    const { data: classData } = await supabase.from('classrooms').select('id, name').eq('name', '6º ANO B').single();
    if (!classData) throw new Error('Turma 6º ANO B não encontrada');
    console.log('--- Analisando Turma:', classData.name, '---');

    // 2. Get students actively enrolled in 6º ANO B
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, students(*)')
      .eq('classroom_id', classData.id);
    
    if (!enrollments) return;

    const classStudents = enrollments.map(e => e.students);
    const studentNames = classStudents.map(s => s.name);

    // 3. Find all student records with these names
    const { data: allRecords } = await supabase
      .from('students')
      .select('*')
      .in('name', studentNames);

    const groups = {};
    allRecords.forEach(s => {
      if (!groups[s.name]) groups[s.name] = [];
      groups[s.name].push(s);
    });

    const duplicateFindings = [];

    for (const name in groups) {
      if (groups[name].length > 1) {
        const records = groups[name];
        const recordDetails = [];

        for (const student of records) {
          const { data: enrs } = await supabase
            .from('enrollments')
            .select('id, classroom_id, status, classrooms(name)')
            .eq('student_id', student.id);
          
          const { data: movements } = await supabase
            .from('student_movements')
            .select('id')
            .eq('student_id', student.id);

          const { data: occurrences } = await supabase
            .from('student_occurrence_reports')
            .select('id')
            .eq('student_id', student.id);

          recordDetails.push({
            id: student.id,
            registration: student.registration_number,
            enrollments: (enrs || []).map(e => `${e.classrooms?.name || 'Unknown'} (${e.status})`),
            movementsCount: (movements || []).length,
            occurrencesCount: (occurrences || []).length,
            hasData: (enrs || []).length > 0 || (movements || []).length > 0 || (occurrences || []).length > 0
          });
        }

        duplicateFindings.push({
          name: name,
          records: recordDetails
        });
      }
    }

    console.log(JSON.stringify(duplicateFindings, null, 2));

  } catch (error) {
    console.error('Erro:', error.message);
  }
}

run();
