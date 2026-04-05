const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Lista do SIGEEDUCA - 6º ANO D - Turma D - Turno VESPERTINO
// 28 matriculados + 2 transferidos = 30 total
const students6D = [
  { registration: "3960119", name: "DAVY HENRIQUE BACHIERA COSTA" },
  { registration: "3960138", name: "JOÃO MIGUEL JESUS ARAÚJO THOMÉ" },
  { registration: "3960214", name: "ADRIEL COSTA GONÇALO" },
  { registration: "2966259", name: "MATRIANA BENICIO COSTA" },
  { registration: "2966206", name: "JOAO VICTOR DOS SANTOS MATEUS" },
  { registration: "2966084", name: "GABRIEL PLACUINO TKARARZAN" },
  { registration: "3965431", name: "JEFERSON TURRA DOS SANTOS" },
  { registration: "2965427", name: "SAMUEL LEANDRO DO VALE" },
  { registration: "2997251", name: "ARTHUR DE LIMA SANCHES" },
  { registration: "2997220", name: "AKEMILY MARIA BALDANA PALM" },
  { registration: "2267110", name: "LORIANE DA SILVA BEZERRA" },
  { registration: "2269305", name: "ALISON VICTOR DOS SANTOS PORTO" },
  { registration: "2369004", name: "GABRIEL MARTINS LIMA" },
  { registration: "2323401", name: "TARAYNYNET KAIRAL METUKTIRE" },
  { registration: "2228763", name: "ELOISA DE SOUZA D'ÁS" },
  { registration: "2969047", name: "IAN SILVA VALNIRS" },
  { registration: "3659083", name: "CRISTIANO HENRIQUE DA COSTA SOUZA" },
  { registration: "3369930", name: "NICOLLA LINDCIA ZILVA" },
  { registration: "2323714", name: "GABTRELLY CORREIA DOS SANTOS" },
  { registration: "2326081", name: "MATHEUS DE SOUZA FRANÇA" },
  { registration: "2395807", name: "JOÃO PAULO SOARES DE OLIVEIRA" },
  { registration: "3671369", name: "JOYSE DE JESUS DOS SANTOS" },
  { registration: "2671365", name: "JORGE HENRIQUE PEREIRA DE AZEVEDO" },
  { registration: "2671289", name: "FRAIKLEY VICTOR PAULINO BRITO" },
  { registration: "2998402", name: "FELIPE GERMANO BENTO DA SILVA" },
  { registration: "2289816", name: "HUGO BRUNO ARAÚJO DE ALMEIDA" },
  { registration: "2269319", name: "ESTER SANTANA RODRIGUES SANTOS" },
  { registration: "2719652", name: "HENRY DARIEL CARDOSO DORIA" },
  { registration: "2693188", name: "ENZO VINICIUS ALMONDES DE LIMA" },
  { registration: "2326902", name: "BEP METUKTIRE" },
];

async function update() {
  try {
    const className = '6º ANO D';
    const { data: classroom, error: cError } = await supabase
      .from('classrooms')
      .select('id')
      .eq('name', className)
      .single();

    if (cError || !classroom) {
      console.error('Turma não encontrada:', cError?.message);
      return;
    }

    console.log(`Turma: ${className} (ID: ${classroom.id})`);

    for (const student of students6D) {
      console.log(`\nProcessando: ${student.name}`);

      // Upsert aluno
      const { data: newStudent, error: sError } = await supabase
        .from('students')
        .upsert([{
          name: student.name,
          registration_number: student.registration,
          birth_date: "2014-01-01", // Placeholder
          paed: !!student.paed,
          school_transport: false
        }], { onConflict: 'registration_number' })
        .select()
        .single();

      if (sError) {
        console.error(`  Erro Aluno ${student.name}:`, sError.message);
        continue;
      }

      // Verificar matrícula ativa
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id, classroom_id')
        .eq('student_id', newStudent.id)
        .is('end_date', null)
        .maybeSingle();

      if (existing) {
        if (existing.classroom_id !== classroom.id) {
          await supabase.from('enrollments').update({ classroom_id: classroom.id }).eq('id', existing.id);
          console.log(`  -> Movido para 6D: ${student.name}`);
        } else {
          console.log(`  -> Já está no 6D: ${student.name}`);
        }
      } else {
        await supabase.from('enrollments').insert([{
          student_id: newStudent.id,
          classroom_id: classroom.id,
          enrollment_date: new Date().toLocaleDateString('sv-SE')
        }]);
        console.log(`  -> Matriculado no 6D: ${student.name}`);
      }
    }

    console.log('\n--- FIM DA ATUALIZAÇÃO DO 6º ANO D ---');

    // Verificação final
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('students(name, registration_number)')
      .eq('classroom_id', classroom.id)
      .is('end_date', null);

    console.log(`\nTotal de alunos ativos no 6D: ${enrollments?.length ?? 0}`);
  } catch (err) {
    console.error('Erro FATAL:', err.message);
  }
}

update();
