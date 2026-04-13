const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const YURI_ID = '1df98205-824b-4613-b176-265c040400fb';
const NATHALY_ID = 'ff6f0797-7b44-44e8-8133-0c19a62fbc30';
const GLENNDA_ID = 'db260e4f-da2f-4113-bb86-cde22fbd02ea';
const DUPLICATE_GUILHERME_ID = '42fefe9c-12bc-445a-b1da-e6c469fb663c';
const CLASSROOM_B_ID = 'e3707ca3-d72d-473d-a072-afaa2d616906';

async function run() {
  console.log('--- Iniciando Sincronização Final - 6º ANO B (Meta: 32 Alunos) ---');
  
  // 1. Atualizar Yuri
  console.log('Atualizando Yuri Gabriel...');
  await supabase.from('students').update({ registration_number: '2569400' }).eq('id', YURI_ID);

  // 2. Reativar Nathaly e Glennda
  console.log('Reativando Nathaly e Glennda...');
  await supabase.from('enrollments').update({ status: 'ATIVO' }).eq('student_id', NATHALY_ID).eq('classroom_id', CLASSROOM_B_ID);
  await supabase.from('enrollments').update({ status: 'ATIVO' }).eq('student_id', GLENNDA_ID).eq('classroom_id', CLASSROOM_B_ID);
  
  // Também atualizar o status do aluno (students table)
  await supabase.from('students').update({ status: 'ATIVO' }).eq('id', NATHALY_ID);
  await supabase.from('students').update({ status: 'ATIVO' }).eq('id', GLENNDA_ID);

  // 3. Remover duplicata de Guilherme
  console.log('Removendo duplicata de Guilherme...');
  // Deletar a matrícula primeiro ou student (cascade delete usually handles it if set, but let's just delete the student)
  const { error: delErr } = await supabase.from('students').delete().eq('id', DUPLICATE_GUILHERME_ID);
  if (delErr) console.error('Erro ao deletar:', delErr.message);
  else console.log('Sucesso.');

  // 4. Verificação final
  const { data: finalEnr } = await supabase.from('enrollments').select('id').eq('classroom_id', CLASSROOM_B_ID).eq('status', 'ATIVO');
  console.log(`\nCONTAGEM FINAL DE ALUNOS ATIVOS NO 6º B: ${finalEnr.length}`);
  
  console.log('--- Sincronização concluída! ---');
}

run();
