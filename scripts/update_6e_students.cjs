const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Lista do SIGEEDUCA - 6º ANO E - Turno VESPERTINO
// Total: 30 alunos
const students6E = [
  { registration: "2671263", name: "JOÃO LUIZ MESQUITA SILVA DOS SANTOS",          transport: true,  paed: false },
  { registration: "2671633", name: "MIKAELY CRISTINA FERREIRA DOS SANTOS",         transport: true,  paed: false },
  { registration: "3421444", name: "JOAQUIM LEITE MARCHORO",                        transport: false, paed: false },
  { registration: "2971945", name: "HECTOR BEATRIZ DOS SANTOS MARTINS",            transport: false, paed: false },
  { registration: "2675483", name: "JOSE EDUARDO DOURADO DE ARAUJO",               transport: false, paed: false },
  { registration: "2676657", name: "ANA CLARA DE OLIVEIRA ANDRADE",                transport: false, paed: false },
  { registration: "3073603", name: "RAYQUE VITOR DOS SANTOS RODRIGUES",            transport: false, paed: false },
  { registration: "2310125", name: "KHYMERILLY KLEIVE VAZ DE OLIVEIRA",            transport: false, paed: false },
  { registration: "2879304", name: "ADRIYAN SOUSA DOS ANJOS",                      transport: false, paed: false },
  { registration: "2290250", name: "KOKOREJI MARUZA METUKIRE",                     transport: false, paed: false },
  { registration: "2697017", name: "NICOLAS JOSÉ PEREIRA VIANA",                   transport: false, paed: true  },
  { registration: "3068981", name: "GUILHERME DOS SANTOS AMORIM",                  transport: false, paed: false },
  { registration: "2297023", name: "MAYRA CLARA FERREIRA DOS SANTOS",              transport: true,  paed: false },
  { registration: "2475383", name: "VICTOR JOAQUIM MARQUES MADEIRA",               transport: false, paed: false },
  { registration: "2093087", name: "GUILHERME HENRIQUE MOREIRA DA SILVA",          transport: false, paed: false },
  { registration: "3093380", name: "GREG NOJAN DO AMARAL",                         transport: false, paed: false },
  { registration: "3626581", name: "YASMIN MARA VITÓRIA NASCIMENTO DA SILVA PEDROSO", transport: true, paed: false },
  { registration: "3004352", name: "SAMUEL LUÍS FERREIRA DA SILVA",                transport: true,  paed: false },
  { registration: "2336717", name: "YAYOKE APISTROS DO NASCIMENTO JURUNA",         transport: false, paed: false },
  { registration: "2390012", name: "ELOISA MOREIRA DONATO",                        transport: false, paed: false },
  { registration: "3052584", name: "JOÃO PEDRO FIRMINO DA SILVA",                  transport: false, paed: false },
  { registration: "2116781", name: "EMI VITÓRIA DE ALMEIDA FAUSTINO",              transport: true,  paed: false },
  { registration: "2671307", name: "GABRIELA HENRIQUE GIZON DA SILVA",             transport: true,  paed: false },
  { registration: "2277854", name: "LUZ MIGUEL CHAVES MENDONÇA",                   transport: false, paed: false },
  { registration: "2312384", name: "RUTE DOS SANTOS MAGOLO",                       transport: false, paed: false },
  { registration: "3546989", name: "ROSE IRAMUEILY ALMEIDA ARARA",                 transport: false, paed: false },
  { registration: "3069260", name: "YZANN YOMARA RIBEIRO DE SOUZA",               transport: false, paed: false },
  { registration: "2727020", name: "ANTONIO HENRIQUE DOS SANTOS CORREIA",          transport: false, paed: false },
  { registration: "2731926", name: "JOSE MARCIO LEMOS CABRAL",                    transport: true,  paed: true  },
  { registration: "2735279", name: "ALEXANDRE MOURA DOS SANTOS",                   transport: false, paed: true  },
];

async function update() {
  try {
    const className = '6º ANO E';
    const { data: classroom, error: cError } = await supabase
      .from('classrooms')
      .select('id')
      .eq('name', className)
      .single();

    if (cError || !classroom) {
      console.error('❌ Turma não encontrada:', cError?.message);
      console.log('Turmas disponíveis: procure pelo nome exato no banco.');
      return;
    }

    console.log(`✅ Turma: ${className} (ID: ${classroom.id})\n`);
    let matriculados = 0, movidos = 0, jaOk = 0, erros = 0;

    for (const student of students6E) {
      process.stdout.write(`Processando: ${student.name}... `);

      const { data: newStudent, error: sError } = await supabase
        .from('students')
        .upsert([{
          name: student.name,
          registration_number: student.registration,
          birth_date: '2014-01-01', // Placeholder — corrigir individualmente se necessário
          paed: student.paed,
          school_transport: student.transport
        }], { onConflict: 'registration_number' })
        .select()
        .single();

      if (sError) {
        process.stdout.write(`ERRO: ${sError.message}\n`);
        erros++;
        continue;
      }

      const { data: existing } = await supabase
        .from('enrollments')
        .select('id, classroom_id')
        .eq('student_id', newStudent.id)
        .is('end_date', null)
        .maybeSingle();

      if (existing) {
        if (existing.classroom_id !== classroom.id) {
          await supabase.from('enrollments').update({ classroom_id: classroom.id }).eq('id', existing.id);
          process.stdout.write(`→ MOVIDO para 6E\n`);
          movidos++;
        } else {
          process.stdout.write(`→ JÁ ESTÁ no 6E\n`);
          jaOk++;
        }
      } else {
        await supabase.from('enrollments').insert([{
          student_id: newStudent.id,
          classroom_id: classroom.id,
          enrollment_date: new Date().toLocaleDateString('sv-SE')
        }]);
        process.stdout.write(`→ MATRICULADO no 6E\n`);
        matriculados++;
      }
    }

    console.log('\n══════════════════════════════════════');
    console.log(`  FIM DA ATUALIZAÇÃO - 6º ANO E`);
    console.log(`  Novos: ${matriculados}  |  Movidos: ${movidos}  |  Já ok: ${jaOk}  |  Erros: ${erros}`);
    console.log('══════════════════════════════════════\n');

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('students(name, registration_number)')
      .eq('classroom_id', classroom.id)
      .is('end_date', null);

    console.log(`Total de alunos ativos no 6E: ${enrollments?.length ?? 0}`);
    enrollments?.forEach((e, i) => {
      process.stdout.write(`  ${i+1}. [${e.students?.registration_number}] ${e.students?.name}\n`);
    });
  } catch (err) {
    console.error('Erro FATAL:', err.message);
  }
}

update();
