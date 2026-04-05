const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Lista Oficial SIGEEDUCA 2026 - 6º ANO A (Matutino)
const students6A = [
  { registration: "2692226", name: "ANA CLARA PEREIRA BRITO",                        birth: "2015-02-12" },
  { registration: "2930372", name: "BEPIET PANARA METUKTIRE",                        birth: "2014-02-28" },
  { registration: "2289228", name: "CRISLAINE VICTORIA FARIAS DE ALMEIDA",          birth: "2014-05-27" },
  { registration: "2289227", name: "CRISLIANE EDUARDA FARIAS DE ALMEIDA",           birth: "2014-05-27" },
  { registration: "2667873", name: "DAVI LUCAS LIMA RODRIGUES",                     birth: "2014-05-03" },
  { registration: "2693931", name: "EMILY CRISTINA DO NASCIMENTO",                  birth: "2014-04-30" },
  { registration: "2288922", name: "ENZO ARTHUR DA SILVA SANTOS",                   birth: "2015-02-02" },
  { registration: "2733219", name: "FELIPE NUNES DA SILVA",                         birth: "2014-06-05" },
  { registration: "2322554", name: "GUILHERME SOUZA ALVES",                         birth: "2014-07-03" },
  { registration: "2295435", name: "GUSTAVO HENRIQUE DE PAULA DE LARA",              birth: "2015-02-05" },
  { registration: "2695589", name: "ISADORA CAETANO MATEUS",                        birth: "2014-10-09" },
  { registration: "2324188", name: "JASMIN RAFAELA AMANCIO DE LIMA",                birth: "2015-02-23" },
  { registration: "2965887", name: "JOÃO GABRIEL DE OLVEIRA MARTINS",               birth: "2014-12-15" },
  { registration: "2667419", name: "JOÃO LUCAS DE SOUZA DA SILVA",                 birth: "2015-01-01" },
  { registration: "2262247", name: "JOÃO OTAVIO GONSALVES DE LIMA",                 birth: "2014-04-13" },
  { registration: "2295434", name: "JOÃO VITOR PEREIRA DA SILVA",                   birth: "2014-06-18" },
  { registration: "2667474", name: "KAUAN FEITOSA MORAES",                          birth: "2014-10-28" },
  { registration: "2467915", name: "LEONEL FELIPE OLIVEIRA DOS SANTOS",              birth: "2014-02-13" },
  { registration: "2667352", name: "MARIA FERNANDA EQUILIDONE MACHADO",              birth: "2014-10-02" },
  { registration: "2667254", name: "MICHEL AZEVEDO PEREIRA",                        birth: "2014-04-04" },
  { registration: "2667239", name: "MIGUEL AZEVEDO PEREIRA",                        birth: "2014-04-04" },
  { registration: "2323854", name: "MIKAELY TIBURCIO SILVA",                        birth: "2014-10-02" },
  { registration: "2970913", name: "MISAEL LUIZ DA SILVA DIAS",                     birth: "2015-01-09" },
  { registration: "2267215", name: "PAULA FERNANDA COIMBRA DA SILVA",               birth: "2014-08-02" },
  { registration: "2288928", name: "SABRINA VITORIA MATIAS MARTINS",                birth: "2014-05-27" },
  { registration: "2667385", name: "WELDER LERRANDRY LOPES APARECIDO",              birth: "2013-05-05" },
  { registration: "2667280", name: "YURY LINS DOS SANTOS MOTA",                     birth: "2014-12-21" },
  { registration: "2317359", name: "FERNANDO OJARA TXUCARRAM\u00c3E",              birth: "2014-06-03" },
  { registration: "3347759", name: "EMILLY VIT\u00d3RIA GOMES DOS SANTOS",          birth: "2014-08-25" },
  { registration: "2735402", name: "DAVI CARVALHO SALMENTO",                        birth: "2013-08-20" },
];

async function update() {
  try {
    const className = '6\u00ba ANO A';
    const { data: classroom } = await supabase.from('classrooms').select('id').eq('name', className).single();
    if (!classroom) return console.error('Turma n\u00e3o encontrada');

    console.log(`Atualizando ${className}...\n`);

    for (const s of students6A) {
      // Upsert Student
      const { data: st, error: sErr } = await supabase
        .from('students')
        .upsert({
          registration_number: s.registration,
          name: s.name,
          birth_date: s.birth,
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
          process.stdout.write(`  ✓ ${s.name} [Movido para 6A]\n`);
        } else {
          process.stdout.write(`  ✓ ${s.name} [J\u00e1 estava no 6A]\n`);
        }
      } else {
        await supabase.from('enrollments').insert({
          student_id: st.id,
          classroom_id: classroom.id,
          enrollment_date: '2026-01-20'
        });
        process.stdout.write(`  ✓ ${s.name} [Matriculado no 6A]\n`);
      }
    }
    console.log('\nFinalizado!');
  } catch (err) {
    console.error('FATAL:', err.message);
  }
}

update();
