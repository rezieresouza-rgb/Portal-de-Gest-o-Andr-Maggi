const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '2c5e5b7d-111e-48ac-b8f8-3f1abedf7148'; // 9º ANO A

const contactsData = [
  { reg: "2057387", guardian: "MARIA LUCILENE DE JESUS SANTOS", phone: "(66) 984384142" },
  { reg: "2165610", guardian: "LUCIENE RODRIGUES DE MELO", phone: "(66) 996402074" },
  { reg: "2076441", guardian: "VALDETE JOSÉ DE OLIVEIRA", phone: "(66) 999962172" },
  { reg: "2085457", guardian: "RAQUEL PEREIRA DUARTE BISPO", phone: "(66) 999972903" },
  { reg: "2095644", guardian: "TATIANE PEREIRA DA SILVA", phone: "(66) 999441575" },
  { reg: "2050208", guardian: "VALERIA OLIVEIRA MARINHO DOS SANTOS", phone: "(66) 996595897" },
  { reg: "2048360", guardian: "CLEUZA CALIXTO DE SOUZA", phone: "(66) 995605537" },
  { reg: "2048482", guardian: "SILVANEIA DA SILVA", phone: "(66) 99583468" },
  { reg: "2050308", guardian: "JULIA IZAURA VIANA", phone: "(66) 996619307" },
  { reg: "2084982", guardian: "EDNA DA SILVA SALES", phone: "(66) 996616830" },
  { reg: "2074580", guardian: "CRISTIANE REBOUÇAS NASCIMENTO PASIN", phone: "(66) 997187901" },
  { reg: "2436262", guardian: "CRISTIELI DE MORAIS SOUZA", phone: "(66) 996424846" },
  { reg: "2050334", guardian: "SIRLENE APARECIDA RIBEIRO", phone: "(66) 996703187" },
  { reg: "2436859", guardian: "ANGELA MARIA TRAMARIN", phone: "(66) 999953839" },
  { reg: "2050351", guardian: "SANDRA RODRIGUES", phone: "(66) 996351561" },
  { reg: "2429328", guardian: "DEIZE CRISTINA STREB", phone: "(66) 999046114" },
  { reg: "2195692", guardian: "MARIA JOSÉ SOARES PEREIRA", phone: "(66) 992528654" },
  { reg: "2050292", guardian: "ADRIANA MORAIS CORREIA RODRIGUES", phone: "(66) 999596594" },
  { reg: "2435167", guardian: "VALDECIR DIAS JÁCOME", phone: "(66) 996016017" },
  { reg: "2115842", guardian: "LUCIMARA SIMÕES DE OLIVEIRA", phone: "(66) 992444843" },
  { reg: "2429809", guardian: "EDINALVA PEREIRA COSTA", phone: "(66) 999147854" },
  { reg: "2057371", guardian: "LUIZ CELSO DE SOUZA FERNANDES", phone: "(66) 996598159" },
  { reg: "2464919", guardian: "TAIS ESPANHOL DE OLIVEIRA", phone: "(66) 984520778" },
  { reg: "2438336", guardian: "ALESSANDRA ROBERTA GODOY DE OLIVEIRA", phone: "(66) 996181900" },
  { reg: "2518402", guardian: "MARIA APARECIDA DE CASTRO DOMINGOS", phone: "(66) 996149026" },
  { reg: "2429254", guardian: "GISLAINE DE FATIMA PEREIRA AMARAL", phone: "(66) 996436100" },
  { reg: "2487206", guardian: "SUELI CHAGAS", phone: "N/A" }, // (66) 00000000 ignored
  { reg: "2068810", guardian: "VALDINEIA DOS SANTOS", phone: "(66) 999314744" },
  { reg: "1997429", guardian: "VILMA PEREIRA DA SILVA", phone: "999241545" },
  { reg: "2436458", guardian: "EDIR CARON", phone: "(66) 996120948" },
  { reg: "2423591", guardian: "JESSICA FAUSTINO PAYÃO", phone: "(66) 999149280" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 9\u00ba ANO A ---');
  let count = 0;

  for (const c of contactsData) {
    const { error } = await supabase
      .from('students')
      .update({
        guardian_name: c.guardian.toUpperCase(),
        contact_phone: c.phone
      })
      .eq('registration_number', c.reg);

    if (error) {
      console.error(`\u274c Erro ao atualizar contatos ${c.reg}:`, error.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  console.log(`\n\u2705 Sucesso: ${count} contatos atualizados.`);
}

syncContacts();
