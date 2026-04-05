const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Lista SIGEEDUCA 2026 - 7º ANO A - MATUTINO
// Total: 30 alunos
const students7A = [
  { registration: "2380648", name: "KAUAN EDUARDO BITENCOURT",                     paed: false },
  { registration: "2690522", name: "PEDRO HENRIQUE TREVIZAN DA SILVA",            paed: false },
  { registration: "2213550", name: "SAMELA VITORIA RAMOS ANDRADE",                paed: false },
  { registration: "2664401", name: "SARAH DOS SANTOS LIMA",                       paed: false },
  { registration: "2603776", name: "SARAH PEREIRA DE ALMEIDA",                    paed: false },
  { registration: "2603788", name: "SOPHIA PEREIRA DE ALMEIDA",                   paed: false },
  { registration: "2664262", name: "TAYNARA FIGUEIREDO VASCON",                   paed: false },
  { registration: "2155708", name: "VICTTOR HUGO MONTEIRO DE SOUZA",              paed: false },
  { registration: "2661725", name: "DAVI LUCA BARBOZA MOREIRA",                   paed: false },
  { registration: "2565180", name: "DHAYYNE LAWINYA GOMES FERREIRA",              paed: false },
  { registration: "2643822", name: "EMANUELLY MORAES GOMES",                      paed: false },
  { registration: "2221703", name: "EMANUELLY VITORIA DIAS PRATES",               paed: false },
  { registration: "2223191", name: "EMILLY VITORIA POCAS DE AMORIM",              paed: false },
  { registration: "2289546", name: "ENDREW ALVES DE SOUZA",                       paed: false },
  { registration: "2383040", name: "ENZO DA COSTA LIMA",                          paed: false },
  { registration: "2664915", name: "ENZO JOS\u00c9 DE SOUZA NICOLETTI",            paed: false },
  { registration: "2623709", name: "ERYCKSON KAUAM PEREIRA DA SILVA",             paed: false },
  { registration: "2681822", name: "FABRICIO LEANDRO FLOR VERDADEIRO",            paed: false },
  { registration: "2381008", name: "FELIPE BONETTI MILHEIRO",                     paed: false },
  { registration: "2307002", name: "GABRIEL HENRIQUE DUARTE",                     paed: true  },
  { registration: "2321382", name: "GEOVANA KETELLEN NASCIMENTO DA COSTA",        paed: false },
  { registration: "2327599", name: "GUSTAVO AMORIM DOS SANTOS",                   paed: false },
  { registration: "2681830", name: "GUSTAVO SILVA FLOR",                          paed: false },
  { registration: "2221294", name: "HELOISE PEDROTTI RAMOS",                      paed: false },
  { registration: "2403307", name: "ISABELA SOARES DO BEM",                       paed: false },
  { registration: "2283314", name: "JO\u00c3O GABRIEL DA SILVA",                  paed: false },
  { registration: "2393801", name: "JO\u00c3O LUCAS DO NASCIMENTO LIMA",          paed: false },
  { registration: "2245470", name: "J\u00daLIA RAFAELA GOMES DA CRUZ",            paed: false },
  { registration: "2389146", name: "NAYANE FERNANDES DA SILVA",                   paed: false },
  { registration: "2599022", name: "LORRAYNE SOUZA JACINTO",                      paed: false },
];

async function update() {
  try {
    const className = '7\u00ba ANO A';
    const { data: classroom } = await supabase.from('classrooms').select('id').eq('name', className).single();
    if (!classroom) return console.error('Turma n\u00e3o encontrada');

    console.log(`Atualizando ${className}...\n`);

    for (const s of students7A) {
      // Upsert Student
      const { data: st, error: sErr } = await supabase
        .from('students')
        .upsert({
          registration_number: s.registration,
          name: s.name,
          birth_date: '2013-01-01', // Placeholder
          paed: s.paed,
          school_transport: false,
          status: 'ATIVO'
        }, { onConflict: 'registration_number' })
        .select()
        .single();

      if (sErr) {
        console.error(`  Erro ${s.name}:`, sErr.message);
        continue;
      }

      // Check Enrollment
      const { data: enroll } = await supabase
        .from('enrollments')
        .select('id, classroom_id')
        .eq('student_id', st.id)
        .is('end_date', null)
        .maybeSingle();

      if (enroll) {
        if (enroll.classroom_id !== classroom.id) {
          await supabase.from('enrollments').update({ classroom_id: classroom.id, enrollment_date: '2026-01-20' }).eq('id', enroll.id);
          process.stdout.write(`  \u2713 ${s.name} [Movido para 7A]\n`);
        } else {
          process.stdout.write(`  \u2713 ${s.name} [J\u00e1 estava no 7A]\n`);
        }
      } else {
        await supabase.from('enrollments').insert({
          student_id: st.id,
          classroom_id: classroom.id,
          enrollment_date: '2026-01-20'
        });
        process.stdout.write(`  \u2713 ${s.name} [Matriculado no 7A]\n`);
      }
    }
    console.log('\nFinalizado!');
  } catch (err) {
    console.error('FATAL:', err.message);
  }
}

update();
