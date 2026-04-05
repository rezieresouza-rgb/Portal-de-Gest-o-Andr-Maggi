const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Lista SIGEEDUCA 2026 - 7º ANO B - MATUTINO
// Total: 29 alunos (28 matriculados, 1 transferido)
const students7B = [
  { registration: "2207901", name: "MURILO SEICENTOS DE LIMA",                    paed: false, status: 'ATIVO' },
  { registration: "2660175", name: "MYCELLENE APARECIDA DOS SANTOS",              paed: false, status: 'ATIVO' },
  { registration: "2581804", name: "PEDRO HENRIQUE REBOU\u00c7AS BALCO",          paed: true,  status: 'ATIVO' },
  { registration: "2243881", name: "TAKAKAJYHY METUKTIRE",                        paed: false, status: 'ATIVO' },
  { registration: "2640205", name: "THIAGO GOMES FERREIRA",                       paed: false, status: 'ATIVO' },
  { registration: "2210225", name: "VITOR DANIEL ARQUINO BATISTA",                paed: true,  status: 'ATIVO' },
  { registration: "2566148", name: "YASMIN VITORIA DE AZEVEDO",                   paed: false, status: 'ATIVO' },
  { registration: "2703254", name: "AMANDA ESTEFANY RIQUEIRA DA SILVA",           paed: false, status: 'ATIVO' },
  { registration: "2322134", name: "ANA BEATRIZ PEREIRA MENDES DOS SANTOS",       paed: false, status: 'ATIVO' },
  { registration: "2664323", name: "ANNA LAURA SILVA RIBEIRO",                    paed: false, status: 'ATIVO' },
  { registration: "2684937", name: "BRENDO HENRIQUE DE OLIVEIRA NOVAIS",          paed: false, status: 'ATIVO' },
  { registration: "2144507", name: "CLEIDIANE SOARES RODRIGUES",                  paed: false, status: 'TRANSFERIDO' },
  { registration: "2500821", name: "FELIP APARECIDO BELARMINO",                   paed: false, status: 'ATIVO' },
  { registration: "2561700", name: "ISABELLY PEREIRA DE SOUZA",                   paed: false, status: 'ATIVO' },
  { registration: "2214158", name: "JO\u00c3O PEDRO SAB\u00d3IA RAMOS",           paed: false, status: 'ATIVO' },
  { registration: "2565119", name: "JO\u00c3O VITOR RAMOS DAUBERTO",              paed: false, status: 'ATIVO' },
  { registration: "2643141", name: "JOHNNY SOUZA ALMEIDA",                        paed: false, status: 'ATIVO' },
  { registration: "2405256", name: "KAIQUE JOS\u00c9 CANDIDO DA SILVA",            paed: false, status: 'ATIVO' },
  { registration: "2333472", name: "KAYLA RAFAELA LAGE HORNICH",                  paed: false, status: 'ATIVO' },
  { registration: "2417516", name: "KETHELYN SOFIA DE SOUSA DOS SANTOS",          paed: false, status: 'ATIVO' },
  { registration: "2243477", name: "KOKON\u00c1 TXUCARRAM\u00c3E",                paed: false, status: 'ATIVO' },
  { registration: "2581800", name: "LUIZ FELIPE BRAIDA",                          paed: false, status: 'ATIVO' },
  { registration: "2243251", name: "LUKAS GON\u00c7ALVES DOMINGOS",               paed: false, status: 'ATIVO' },
  { registration: "2243616", name: "MARIA LARA DAL PUPO DE CARVALHO",             paed: false, status: 'ATIVO' },
  { registration: "2557454", name: "MARIA VITORIA DA SILVA SOUZA",                paed: false, status: 'ATIVO' },
  { registration: "2207801", name: "MIGUEL SEICENTOS DE LIMA",                    paed: false, status: 'ATIVO' },
  { registration: "2663950", name: "MIKAELLY SANTOS AZEVEDO",                     paed: false, status: 'ATIVO' },
  { registration: "2682310", name: "YASMIN VIT\u00d3RIA DO NASCIMENTO FIGUEIREDO",paed: false, status: 'ATIVO' },
  { registration: "2603484", name: "HEVILLY GARCIA JARDIM",                       paed: false, status: 'ATIVO' },
];

async function update() {
  try {
    const className = '7\u00ba ANO B';
    let { data: classroom } = await supabase.from('classrooms').select('id, shift').eq('name', className).single();
    
    if (!classroom) {
      // Create if missing
      const { data: newC } = await supabase.from('classrooms').insert({ name: className, shift: 'MATUTINO' }).select().single();
      classroom = newC;
    } else if (classroom.shift !== 'MATUTINO') {
      // Update shift
      await supabase.from('classrooms').update({ shift: 'MATUTINO' }).eq('id', classroom.id);
      console.log(`Corrigido turno da turma ${className} para MATUTINO.`);
    }

    console.log(`Atualizando ${className}...\n`);

    for (const s of students7B) {
      const { data: st, error: sErr } = await supabase
        .from('students')
        .upsert({
          registration_number: s.registration,
          name: s.name,
          birth_date: '2013-01-01',
          paed: s.paed,
          status: s.status
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
          process.stdout.write(`  \u2713 ${s.name} [Movido para 7B]\n`);
        } else {
          process.stdout.write(`  \u2713 ${s.name} [J\u00e1 estava no 7B]\n`);
        }
      } else {
        await supabase.from('enrollments').insert({
          student_id: st.id,
          classroom_id: classroom.id,
          enrollment_date: '2026-01-20',
          end_date: s.status === 'TRANSFERIDO' ? '2026-02-14' : null
        });
        process.stdout.write(`  \u2713 ${s.name} [Matriculado no 7B]${s.status === 'TRANSFERIDO' ? ' (COM STATUS TRANSFERIDO)' : ''}\n`);
      }
    }
    console.log('\nFinalizado!');
  } catch (err) {
    console.error('FATAL:', err.message);
  }
}

update();
