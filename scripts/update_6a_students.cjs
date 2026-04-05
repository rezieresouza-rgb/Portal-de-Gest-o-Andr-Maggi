const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const studentList = [
  { registration: '2667230', name: 'YURY LINS DOS SANTOS MOTA', paed: false },
  { registration: '2667284', name: 'MICHEL AZEVEDO PEREIRA', paed: false },
  { registration: '2667289', name: 'MIGUEL AZEVEDO PEREIRA', paed: false },
  { registration: '2667474', name: 'KAUAN FEITOSA MORAES', paed: false },
  { registration: '2667419', name: 'JOÃO LUCAS DE SOUZA DA SILVA', paed: false },
  { registration: '2687673', name: 'DAVI LUCAS LIMA RODRIGUES', paed: false },
  { registration: '2667888', name: 'WELBER LERHANDRO LOPES APARECIDO', paed: false },
  { registration: '2667915', name: 'LEONEL FELIPE OLIVEIRA DOS SANTOS', paed: true },
  { registration: '2667952', name: 'MARIA FERNANDA EQUIDONE MACHADO', paed: false },
  { registration: '2669227', name: 'CRISLANE EDUARDA FARIAS DE ALMEIDA', paed: false },
  { registration: '2669069', name: 'CRISLAINE VICTORIA FARIAS DE ALMEIDA', paed: false },
  { registration: '2668986', name: 'ANA CLARA PEREIRA BRITO', paed: false },
  { registration: '2668972', name: 'BEPIET PANARA METUKTIRE', paed: false },
  { registration: '2668902', name: 'ENZO ARTHUR DA SILVA SANTOS', paed: true },
  { registration: '2668931', name: 'EMILY CRISTINA DO NASCIMENTO', paed: false },
  { registration: '2668909', name: 'SABRINA VITORIA MATIAS MARTINS', paed: false },
  { registration: '2668887', name: 'JOAO GABRIEL DE OLIVEIRA MARTINS', paed: false },
  { registration: '2668889', name: 'ISADORA CAETANO MATTOS', paed: false },
  { registration: '2670913', name: 'MISAEL LUIZ DA SILVA DIAS', paed: false },
  { registration: '2285454', name: 'JOÃO VITOR PEREIRA DA SILVA', paed: false },
  { registration: '2286436', name: 'GUSTAVO HENRIQUE DE PAULA DE LARA', paed: false },
  { registration: '2292207', name: 'JOÃO OTAVIO GONSALVES DE LIMA', paed: false },
  { registration: '2302964', name: 'GUILHERME SOUZA ALVES', paed: false },
  { registration: '2287215', name: 'PAULA FERNANDA COIMBRA DA SILVA', paed: false },
  { registration: '2325824', name: 'MIKAELY TIBURCIO SILVA', paed: false },
  { registration: '2304159', name: 'JASMIM RAFAELA AMÂNCIO DE LIMA', paed: false },
  { registration: '2723258', name: 'FELIPE NUNES DA SILVA', paed: false },
  { registration: '2387889', name: 'FERNANDO DJARA TXUCARRAMÃE', paed: false },
  { registration: '2347759', name: 'EMILLY VITÓRIA GOMES DOS SANTOS', paed: false },
  { registration: '2726402', name: 'DAVI CARVALHO SALMENTO', paed: false }
];

async function update() {
  const className = '6º ANO A';
  const shift = 'MATUTINO';
  
  console.log('--- BUSCANDO TURMA ---');
  const { data: classData } = await supabase.from('classrooms').select('id').eq('name', className).eq('shift', shift).single();
  const classId = classData.id;
  console.log('ID Turma:', classId);

  const enrollmentDate = new Date().toISOString().split('T')[0];

  for(const s of studentList) {
    console.log(`Processando: ${s.name}`);
    
    // Upsert Student
    const { data: student, error: sErr } = await supabase
      .from('students')
      .upsert({
        registration_number: s.registration,
        name: s.name,
        paed: s.paed,
        school_transport: false
      }, { onConflict: 'registration_number' })
      .select('id')
      .single();

    if(sErr) {
      console.error('Erro Student:', sErr.message);
      continue;
    }

    const studentId = student.id;

    // Delete existing enrollment to keep only one active
    await supabase.from('enrollments').delete().eq('student_id', studentId);

    // Insert new enrollment
    const { error: eErr } = await supabase
      .from('enrollments')
      .insert([{
        student_id: studentId,
        classroom_id: classId,
        enrollment_date: enrollmentDate
      }]);

    if(eErr) {
      console.error('Erro Enrollment:', eErr.message);
    } else {
      console.log(`OK: ${s.name}`);
    }
  }
}

update();
