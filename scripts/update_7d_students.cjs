const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Lista SIGEEDUCA 2026 - 7º ANO D - VESPERTINO
// Unificação dos relatórios de Situação e Idade
const students7D = [
  { reg: "2380615", name: "ANA HELOISA DO NASCIMENTO",              birth: "2014-04-04", transp: true,  paed: false, status: 'ATIVO' },
  { reg: "2137069", name: "ANA VITORIA DOS SANTOS MATEUS",          birth: "2013-04-03", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2381272", name: "ANDRIELY CAMARA DE SOUZA",               birth: "2013-06-20", transp: false, paed: true,  status: 'ATIVO' },
  { reg: "2176526", name: "REKWYPRYTO METUKTIRE TXUCARRAM\u00c3E",  birth: "2011-06-03", transp: false, paed: false, status: 'TRANSFERIDO' }, // Transf. 20/03
  { reg: "2485770", name: "BRENDA VITORIA DOS SANTOS BESERRA",      birth: "2013-04-05", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2303856", name: "BRUNO VICTOR PEREIRA DA SILVA",          birth: "2013-08-22", transp: true,  paed: false, status: 'ATIVO' },
  { reg: "2191657", name: "CARLOS EDUARDO ALVES CIRILO",            birth: "2013-02-14", transp: true,  paed: false, status: 'ATIVO' },
  { reg: "2389370", name: "DAVI LUCAS ARANHA DA SILVA",             birth: "2013-07-10", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2283334", name: "EDUARDA CARVALHO COSTA",                 birth: "2013-11-20", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2614253", name: "ERICK HONORATO FAGUNDES DE OLIVEIRA",    birth: "2013-05-05", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2601462", name: "ESTER MARTINS DA SILVA",                 birth: "2013-02-23", transp: false, paed: false, status: 'ATIVO' },
  { reg: "1974328", name: "IREKARE METUKTIRE",                      birth: "2010-04-19", transp: false, paed: false, status: 'TRANSFERIDO' }, // Transf. 23/02
  { reg: "2601561", name: "ISAAC BALDUINO DA COSTA",                birth: "2013-12-02", transp: true,  paed: false, status: 'ATIVO' },
  { reg: "2380616", name: "ISABELLY GON\u00c7ALVES ALVES",          birth: "2013-05-01", transp: true,  paed: false, status: 'ATIVO' },
  { reg: "2593855", name: "ISADORA SANTOS CAVALCANTE",              birth: "2013-08-10", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2387818", name: "IZADORA FERREIRA DOS SANTOS",            birth: "2013-08-03", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2283341", name: "JORGE HENRIQUE DOS SANTOS DA COSTA",      birth: "2013-10-19", transp: false, paed: true,  status: 'ATIVO' },
  { reg: "2555500", name: "JULLYANA ALONSO ARAUJO",                 birth: "2014-01-27", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2244544", name: "KARINE VICTORIA OLIVEIRA C\u00c1NDIDO",  birth: "2013-07-12", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2387303", name: "KAYKY RAFAEL DORINI DO PRADO",           birth: "2013-12-01", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2244585", name: "KEMILY KAUANY OLIVEIRA DOS SANTOS",      birth: "2013-07-16", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2289561", name: "KENYA KATTIELLY DA SILVA SANTOS",        birth: "2014-01-05", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2239392", name: "KOKOYAPOTI METUKTIRE",                   birth: "2013-08-02", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2137209", name: "KRYSTHOFFER GABRIEL MARTINS BORGES",     birth: "2013-01-15", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2509285", name: "LUIZ FRANCISCO ROBERT ABREU",            birth: "2013-10-17", transp: true,  paed: false, status: 'ATIVO' },
  { reg: "2142305", name: "PEDRO GABRIEL SANTOS DA SILVA",          birth: "2012-11-10", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2287882", name: "TALITA SANTIAGO DE OLIVEIRA BENTO",      birth: "2014-03-16", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2381487", name: "YURI RAFAEL DOS SANTOS OLIVEIRA",        birth: "2013-08-05", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2040200", name: "CLAUDEMIR ADRIAM CALIXTO BIFI",          birth: "2011-05-10", transp: false, paed: true,  status: 'TRANSFERIDO' }, // Transf. 19/02
  { reg: "2722389", name: "MARIA ELOIZA CAETANO NASCIMENTO",        birth: "2014-02-12", transp: false, paed: false, status: 'ATIVO' },
  { reg: "2731779", name: "ISAAC VITALLO FEITOSA OLIVERIA",         birth: "2010-10-14", transp: false, paed: false, status: 'ATIVO' }, // Do relatório de idade
];

async function update() {
  try {
    const className = '7\u00ba ANO D';
    const { data: classroom } = await supabase.from('classrooms').select('id').eq('name', className).single();
    if (!classroom) return console.error('Turma n\u00e3o encontrada');

    console.log(`Atualizando ${className}...\n`);

    for (const s of students7D) {
      // Upsert Student
      const { data: st, error: sErr } = await supabase
        .from('students')
        .upsert({
          registration_number: s.reg,
          name: s.name,
          birth_date: s.birth,
          paed: s.paed,
          school_transport: s.transp,
          status: s.status
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
          process.stdout.write(`  \u2713 ${s.name} [Movido para 7D]\n`);
        } else {
          process.stdout.write(`  \u2713 ${s.name} [J\u00e1 estava no 7D]\n`);
        }
      } else {
        await supabase.from('enrollments').insert({
          student_id: st.id,
          classroom_id: classroom.id,
          enrollment_date: '2026-01-20'
        });
        process.stdout.write(`  \u2713 ${s.name} [Matriculado no 7D]\n`);
      }
    }
    console.log('\nFinalizado!');
  } catch (err) {
    console.error('FATAL:', err.message);
  }
}

update();
