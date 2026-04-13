const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const GHOST_IDS = [
  'b177713c-7b9d-4956-ad12-03760c71954d', // ISADORA NOBREGA NEGRETE GARCIA
  '5f1a6bef-a048-49c3-86d8-f983c4c4afd4', // JULIANA DE SOUZA CAMPOS
  '710e6b17-f968-44b1-a85c-5fd341deb14e', // LUIZ HENRIQUE SOUZA MATOS
  '5d192b33-a52d-42f5-9efe-aea669bd8990', // MEREKORE TAPAYUNA METUKTIRE
  '8d627bdd-8194-442a-9a08-490749be6319', // STEFANY LAURA RODRIGUES LIMA
  'b84aeb90-8945-4334-8d13-eb9549fe4ae8', // VINICIUS RAFAEL NOVAIS DA SILVA
  'be49cb10-c33f-45a5-97b4-cdd74b8290cd', // YURI GABRIEL ALVES DE AMORIM
  'c756d6be-90f7-47c4-8498-5f73d262cf9f'  // DAVID LUIZ RIBEIRO DOS SANTOS
];

async function run() {
  console.log('--- Iniciando Limpeza de Duplicatas no 6º ANO B ---');
  
  for (const id of GHOST_IDS) {
    console.log(`Excluindo ID: ${id}...`);
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      console.error(`Erro ao excluir ${id}:`, error.message);
    } else {
      console.log(`Sucesso: ${id} removido.`);
    }
  }
  
  console.log('--- Limpeza concluída! ---');
}

run();
