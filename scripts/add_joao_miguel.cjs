const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function addStudent() {
  const student = {
    registration_number: "2734027",
    name: "JOÃO MIGUEL LIMA VIANA",
    gender: "MASCULINO",
    birth_date: "2015-02-09",
    status: "ATIVO",
    address: "RUA NHAMBIQUARA, 171, SETOR SUL, CENTRO, COLIDER-MT",
    guardian_name: "RODRIGO VIANA",
    contact_phone: "(66) 992527796 / (66) 999435982"
  };

  const classroomId = '65988e66-36c6-41b6-988c-60892c5c8053'; // 6º ANO A
  
  console.log("Inserindo aluno: " + student.name);
  const { data: newStudent, error: studentError } = await supabase
    .from('students')
    .upsert(student, { onConflict: 'registration_number' })
    .select('id')
    .single();

  if (studentError) {
    console.error("Erro ao inserir aluno:", studentError);
    return;
  }
  
  console.log("Aluno criado/atualizado com ID:", newStudent.id);
  
  console.log("Inserindo matrícula...");
  const { error: enrollError } = await supabase
    .from('enrollments')
    .upsert({
      student_id: newStudent.id,
      classroom_id: classroomId,
      enrollment_date: "2026-04-16",
      status: "ATIVO"
    }, { onConflict: 'student_id,classroom_id' });

  if (enrollError) {
    console.error("Erro ao inserir matrícula:", enrollError);
  } else {
    console.log("Matrícula inserida com sucesso no 6º Ano A!");
  }
}

addStudent();
