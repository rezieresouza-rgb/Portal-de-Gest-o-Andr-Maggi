const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const students6A = [
  { registration: "2667230", name: "YURY LINS DOS SANTOS MOTA" },
  { registration: "2667284", name: "MICHEL AZEVEDO PEREIRA" },
  { registration: "2667289", name: "MIGUEL AZEVEDO PEREIRA" },
  { registration: "2667474", name: "KAUAN FEITOSA MORAES" },
  { registration: "2667419", name: "JOÃO LUCAS DE SOUZA DA SILVA" },
  { registration: "2687673", name: "DAVI LUCAS LIMA RODRIGUES" },
  { registration: "2667888", name: "WELBER LERHANDRO LOPES APARECIDO" },
  { registration: "2667915", name: "LEONEL FELIPE OLIVEIRA DOS SANTOS", paed: true },
  { registration: "2667952", name: "MARIA FERNANDA EQUIDONE MACHADO" },
  { registration: "2669227", name: "CRISLANE EDUARDA FARIAS DE ALMEIDA" },
  { registration: "2669069", name: "CRISLAINE VICTORIA FARIAS DE ALMEIDA" },
  { registration: "2668986", name: "ANA CLARA PEREIRA BRITO" },
  { registration: "2668972", name: "BEPIET PANARA METUKTIRE" },
  { registration: "2668902", name: "ENZO ARTHUR DA SILVA SANTOS", paed: true },
  { registration: "2668931", name: "EMILY CRISTINA DO NASCIMENTO" },
  { registration: "2668909", name: "SABRINA VITORIA MATIAS MARTINS" },
  { registration: "2668887", name: "JOAO GABRIEL DE OLIVEIRA MARTINS" },
  { registration: "2668889", name: "ISADORA CAETANO MATTOS" },
  { registration: "2670913", name: "MISAEL LUIZ DA SILVA DIAS" },
  { registration: "2285454", name: "JOÃO VITOR PEREIRA DA SILVA" },
  { registration: "2286436", name: "GUSTAVO HENRIQUE DE PAULA DE LARA" },
  { registration: "2292207", name: "JOÃO OTAVIO GONSALVES DE LIMA" },
  { registration: "2302964", name: "GUILHERME SOUZA ALVES" },
  { registration: "2287215", name: "PAULA FERNANDA COIMBRA DA SILVA" },
  { registration: "2325824", name: "MIKAELY TIBURCIO SILVA" },
  { registration: "2304159", name: "JASMIM RAFAELA AMÂNCIO DE LIMA" },
  { registration: "2723258", name: "FELIPE NUNES DA SILVA" },
  { registration: "2387889", name: "FERNANDO DJARA TXUCARRAMÃE" },
  { registration: "2347759", name: "EMILLY VITÓRIA GOMES DOS SANTOS" },
  { registration: "2726402", name: "DAVI CARVALHO SALMENTO" }
];

async function update() {
  try {
    const className = '6º ANO A';
    const { data: classroom } = await supabase.from('classrooms').select('id').eq('name', className).single();
    if (!classroom) return console.error('Turma não encontrada');

    console.log(`Turma: ${className} (ID: ${classroom.id})`);

    for (const student of students6A) {
      console.log(`Processando: ${student.name}`);
      
      // Upsert Aluno com dummy birth_date (necessário pelo schema)
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
        console.error(`Erro Aluno ${student.name}:`, sError.message);
        continue;
      }

      // Limpar matrículas anteriores para essa turma (e outras se necessário)
      // O script 9E faz isso aluno por aluno
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id, classroom_id')
        .eq('student_id', newStudent.id)
        .is('end_date', null)
        .maybeSingle();

      if (existing) {
        if (existing.classroom_id !== classroom.id) {
          await supabase.from('enrollments').update({ classroom_id: classroom.id }).eq('id', existing.id);
          console.log(`Movido para 6A: ${student.name}`);
        } else {
          console.log(`Já está no 6A: ${student.name}`);
        }
      } else {
        await supabase.from('enrollments').insert([{
          student_id: newStudent.id,
          classroom_id: classroom.id,
          enrollment_date: new Date().toLocaleDateString('sv-SE')
        }]);
        console.log(`Matriculado no 6A: ${student.name}`);
      }
    }
    console.log('--- FIM DA ATUALIZAÇÃO ---');
  } catch (err) {
    console.error('Erro FATAL:', err.message);
  }
}

update();
