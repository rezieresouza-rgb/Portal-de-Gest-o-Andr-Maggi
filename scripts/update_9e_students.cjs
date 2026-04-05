
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

const students9E = [
  { registration: "2050892", name: "ADRYAN GABRIEL BEZERRA FERRANTE" },
  { registration: "2050276", name: "AMANDA GABRIELLY CARDOSO DA SILVA" },
  { registration: "2427733", name: "ANA BEATRIZ DOS SANTOS SILVA" },
  { registration: "2139177", name: "ANA CLARA PIERI MARIANO" },
  { registration: "2435131", name: "ANA MARIA PEREIRA DE OLIVEIRA" },
  { registration: "2423308", name: "ARTHUR SERGIO DORIM PEREIRA" },
  { registration: "2041938", name: "CLARA CASSEMIRO LEITE DOS SANTOS" },
  { registration: "2423310", name: "DAVI SANTOS SOARES" },
  { registration: "1913705", name: "DIEGO JUNIO MARTINS DE ARAÚJO" },
  { registration: "2035427", name: "ELIANA CRISTINA PEREIRA GIZONI" },
  { registration: "2423314", name: "EMANUELY TONON MOREIRA DA SILVA" },
  { registration: "2051011", name: "EMILLY CAUANI ALVES BISPO" },
  { registration: "2423327", name: "JOÃO VICTOR DOS SANTOS BORGES" },
  { registration: "1991638", name: "KAMILA NETUKITIRE" },
  { registration: "2342753", name: "KAUANY SANITA CANGÜÇU" },
  { registration: "2043234", name: "KETHELLEN NORAINY PEREIRA NETO" },
  { registration: "2140147", name: "LARA BEATRIZ SALGADO RIBEIRO" },
  { registration: "2417624", name: "LORENA AUGUSTO GOMES" },
  { registration: "2033812", name: "LUCAS PERES BERDEIRA" },
  { registration: "1919108", name: "LUIZ ANTONIO DA SILVA DE SOUZA" },
  { registration: "2041125", name: "NADYELLY VITORIA MORAES DA COSTA FERREIRA" },
  { registration: "2423230", name: "PEDRO HENRIQUE DE SANTANA GUIMARÃES" },
  { registration: "2011325", name: "PEDRO HENRIQUE SOARES GOMES" },
  { registration: "2041918", name: "THAIS LARISSA BATISTA" },
  { registration: "2423282", name: "VICTOR GABRIEL SANTOS CAVALCANTE" },
  { registration: "2435002", name: "VITÓRIA CAZELATO VALERIANO" },
  { registration: "2435792", name: "YASMIN VITORIA FREITAS WEIDLICH" },
  { registration: "2423340", name: "MARIA EDUARDA BACHEGA DA COSTA" },
  { registration: "2423251", name: "MARRYA ISABEL DA SILVA PARDO" },
  { registration: "2043360", name: "CLAUDEMIR ADRIAN CALIXTO DIFI" }
];

async function update() {
  try {
    // 1. Encontrar a turma "9º ANO E"
    const { data: classroom, error: classError } = await supabase
      .from('classrooms')
      .select('id')
      .eq('name', '9º ANO E')
      .single();

    if (classError || !classroom) {
      console.error('Turma 9º ANO E não encontrada.');
      return;
    }

    console.log(`Turma encontrada: ${classroom.id}`);

    // 2. Processar cada aluno
    for (const student of students9E) {
      console.log(`Processando: ${student.name} (${student.registration})`);

      // 2.1 Upsert Aluno
      const { data: newStudent, error: sError } = await supabase
        .from('students')
        .upsert([{
          name: student.name,
          registration_number: student.registration
        }], { onConflict: 'registration_number' })
        .select()
        .single();

      if (sError) {
        console.error(`Erro ao salvar aluno ${student.name}:`, sError.message);
        continue;
      }

      // 2.2 Verificar se já está matriculado nesta turma (ativa)
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id, classroom_id')
        .eq('student_id', newStudent.id)
        .is('end_date', null)
        .maybeSingle();

      if (existingEnrollment) {
        if (existingEnrollment.classroom_id !== classroom.id) {
          // Atualizar para a nova turma
          const { error: eError } = await supabase
            .from('enrollments')
            .update({ classroom_id: classroom.id })
            .eq('id', existingEnrollment.id);
          
          if (eError) console.error(`Erro ao mover matrícula de ${student.name}:`, eError.message);
          else console.log(`Matrícula de ${student.name} movida para 9º E.`);
        } else {
          console.log(`${student.name} já está matriculado no 9º E.`);
        }
      } else {
        // Criar nova matrícula
        const { error: eError } = await supabase
          .from('enrollments')
          .insert([{
            student_id: newStudent.id,
            classroom_id: classroom.id,
            enrollment_date: new Date().toLocaleDateString('sv-SE')
          }]);
        
        if (eError) console.error(`Erro ao criar matrícula de ${student.name}:`, eError.message);
        else console.log(`Nova matrícula criada para ${student.name} no 9º E.`);
      }
    }

    console.log('Atualização concluída!');

  } catch (err) {
    console.error('Erro geral:', err.message);
  }
}

update();
