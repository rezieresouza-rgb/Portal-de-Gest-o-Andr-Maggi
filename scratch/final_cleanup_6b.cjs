const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const GHOST_RECORDS = [
  { id: '291c8d5d-b9da-48ef-ab1c-ce4ec1f294a4', name: 'ALISON GUILHERME RODRIGUES ARAUJO' },
  { id: '0bae89f7-ffad-439a-b983-c8721526a87d', name: 'DANIEL ROBERT RUFINO DA COSTA' },
  { id: '1d6a0837-9a1e-464e-ade4-53223546adfc', name: 'EMANUEL LORENZO DO CARMO BRANCO' },
  { id: '19ef6b10-c905-4cea-b8bf-5cf26538a1ca', name: 'ENZO GONÇALVES DOS SANTOS' },
  { id: '29a2baf2-d572-46a7-937c-48680ad6f30f', name: 'GABRIEL DA SILVA SOUZA' },
  { id: 'a762c920-5a93-4e0f-9035-f09ba8cb0005', name: 'GLENNDA GOMES DE SOUZA' },
  { id: '1e562d20-3f4c-4a0e-a4d5-858a2e9dd9ce', name: 'LUCAS GABRIEL DE SOUZA' },
  { id: 'b177713c-7b9d-4956-ad12-03760c71954d', name: 'ISADORA NOBREGA NEGRETE GARCIA' },
  { id: '5f1a6bef-a048-49c3-86d8-f983c4c4afd4', name: 'JULIANA DE SOUZA CAMPOS' },
  { id: '710e6b17-f968-44b1-a85c-5fd341deb14e', name: 'LUIZ HENRIQUE SOUZA MATOS' },
  { id: '5d192b33-a52d-42f5-9efe-aea669bd8990', name: 'MEREKORE TAPAYUNA METUKTIRE' },
  { id: '8d627bdd-8194-442a-9a08-490749be6319', name: 'STEFANY LAURA RODRIGUES LIMA' },
  { id: 'b84aeb90-8945-4334-8d13-eb9549fe4ae8', name: 'VINICIUS RAFAEL NOVAIS DA SILVA' },
  { id: 'be49cb10-c33f-45a5-97b4-cdd74b8290cd', name: 'YURI GABRIEL ALVES DE AMORIM' },
  { id: 'c756d6be-90f7-47c4-8498-5f73d262cf9f', name: 'DAVID LUIZ RIBEIRO DOS SANTOS' }
];

async function run() {
  console.log('--- Iniciando Limpeza Final - 6º ANO B (15 ALUNOS) ---');
  
  for (const ghost of GHOST_RECORDS) {
    console.log(`\nProcessando: ${ghost.name} (ID: ${ghost.id})`);
    
    // 1. Verificações de segurança
    const { data: enrs } = await supabase.from('enrollments').select('id').eq('student_id', ghost.id);
    if (enrs && enrs.length > 0) {
      console.log(`  AVISO: Pulando ${ghost.name} pois possui ${enrs.length} matrículas.`);
      continue;
    }

    // 2. Limpeza de dependências (Busca Ativa, etc)
    // Tentar migrar ou deletar dependências que possam bloquear a exclusão
    await supabase.from('active_search_actions').delete().eq('student_id', ghost.id);

    // 3. Exclusão do registro
    const { error: delErr } = await supabase.from('students').delete().eq('id', ghost.id);
    
    if (delErr) {
      console.error(`  ERRO ao excluir: ${delErr.message}`);
    } else {
      console.log(`  SUCESSO: Registro removido.`);
    }
  }
  
  console.log('\n--- Limpeza Concluída! ---');
}

run();
