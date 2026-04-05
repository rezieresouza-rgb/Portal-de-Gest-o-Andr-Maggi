const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Lista Oficial SIGEEDUCA 2026 - 6º ANO B (Matutino)
// Total 31 alunos
const students6B = [
  { registration: "2669401", name: "ALISON GUILHERME RODRIGUES ARAUJO",              birth: "2014-02-25" },
  { registration: "2663159", name: "ANTHONY MIGUEL PEREIRA DE SOUZA",               birth: "2014-01-27" },
  { registration: "2239407", name: "BEKIRE METUKTIRE",                              birth: "2014-04-23" },
  { registration: "2236743", name: "BEPY ARETI METUKTIRE",                          birth: "2015-03-05" },
  { registration: "2673401", name: "BRENDA VITORIA SILVA BERTORELLO",               birth: "2014-07-12" },
  { registration: "2722574", name: "CAMILLY VITORIA BALDINO SOARES",                birth: "2015-01-27" },
  { registration: "2289965", name: "DANIEL ROBERT RUFINO DA COSTA",                 birth: "2014-07-31" },
  { registration: "2153703", name: "EDUARDO PEREIRA DA SILVA SIMPLICIO",            birth: "2012-10-23" },
  { registration: "2671946", name: "EMANUEL LORENZO DO CARMO BRANCO",               birth: "2014-05-21" },
  { registration: "2321383", name: "EVERTON KAUAN DOMICIANO GON\u00c7ALVES",        birth: "2014-12-03" },
  { registration: "2683203", name: "ENZO GON\u00c7ALVES DOS SANTOS",                birth: "2014-12-19" },
  { registration: "2389829", name: "GABRIEL DA SILVA SOUZA",                        birth: "2014-11-27" },
  { registration: "2289559", name: "GUILHERME CONSTANTINO DE LIMA",                 birth: "2014-06-19" },
  { registration: "2289407", name: "GLENNDA GOMES DE SOUZA",                        birth: "2014-07-05" },
  { registration: "2389403", name: "ISADORA NOBREGA NEGRETE GARCIA",                birth: "2014-10-30" },
  { registration: "2239457", name: "JHENIFER PEREIRA DA SILVA SIMPLICIO",           birth: "2014-01-24" },
  { registration: "2283745", name: "JO\u00c3O MIGUEL MARTINS NOVAIS",               birth: "2014-12-10" },
  { registration: "2289565", name: "JULIANA DE SOUZA CAMPOS",                       birth: "2014-08-04" },
  { registration: "2283221", name: "LAUARA LAIANNY APARECIDA ASSUN\u00c7\u00c3O",   birth: "2014-06-15" },
  { registration: "2674807", name: "LUCAS GABRIEL DE SOUZA",                        birth: "2015-02-03" },
  { registration: "2685941", name: "LUIZ HENRIQUE SOUZA MATOS",                     birth: "2014-04-29" },
  { registration: "2381029", name: "MARIA CLARA CARDOSO RESENDE",                    birth: "2015-05-26" },
  { registration: "2721831", name: "NATHALY POLLYANE LOPES DA SILVA RIBEIRO",       birth: "2014-06-05" },
  { registration: "2389404", name: "ST\u00c9FANY LAURA RODRIGUES LIMA",              birth: "2014-08-03" },
  { registration: "2673407", name: "THAEMILLY REGIELLY MARCELINO SOARES",           birth: "2014-07-22" },
  { registration: "2710703", name: "VINICIUS RAFAEL NOVAIS DA SILVA",               birth: "2015-02-09" },
  { registration: "2689354", name: "VITORIA GABRIELLY DIAS",                        birth: "2014-07-07" },
  { registration: "2389409", name: "YURI GABRIEL ALVES DE AMORIM",                  birth: "2014-10-20" },
  { registration: "2236809", name: "MEREKORE TAPAYUNA METUKTIRE",                   birth: "2014-02-20" },
  { registration: "2729921", name: "DAVID LUIZ RIBEIRO DOS SANTOS",                 birth: "2015-02-23" },
  { registration: "3431373", name: "SABINA DOS SANTOS SILVA",                       birth: "2014-05-15" },
];

async function update() {
  try {
    const className = '6\u00ba ANO B';
    const { data: classroom } = await supabase.from('classrooms').select('id').eq('name', className).single();
    if (!classroom) return console.error('Turma n\u00e3o encontrada');

    console.log(`Atualizando ${className}...\n`);

    for (const s of students6B) {
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

      const { data: enroll } = await supabase
        .from('enrollments')
        .select('id, classroom_id')
        .eq('student_id', st.id)
        .is('end_date', null)
        .maybeSingle();

      if (enroll) {
        if (enroll.classroom_id !== classroom.id) {
          await supabase.from('enrollments').update({ classroom_id: classroom.id, enrollment_date: '2026-01-20' }).eq('id', enroll.id);
          process.stdout.write(`  \u2713 ${s.name} [Movido para 6B]\n`);
        } else {
          process.stdout.write(`  \u2713 ${s.name} [J\u00e1 estava no 6B]\n`);
        }
      } else {
        await supabase.from('enrollments').insert({
          student_id: st.id,
          classroom_id: classroom.id,
          enrollment_date: '2026-01-20'
        });
        process.stdout.write(`  \u2713 ${s.name} [Matriculado no 6B]\n`);
      }
    }
    console.log('\nFinalizado!');
  } catch (err) {
    console.error('FATAL:', err.message);
  }
}

update();
