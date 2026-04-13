const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2580815", guardian: "ADRIANA TOMPOROSKI NASCIMENTO", phone: "(66) 999573694 / (66) 999022690" },
  { reg: "2137069", guardian: "ANGÉLICA DOS SANTOS CORRÊA", phone: "(66) 996384378" },
  { reg: "2601272", guardian: "ANDREIA CAMARA DE SOUZA", phone: "(66) 996833960" },
  { reg: "2176526", guardian: "BEPNGRI METUKTIRE TXUCARRAMÃE", phone: "(66) 999567741" },
  { reg: "2486770", guardian: "GESLEY PEREIRA BESERRA", phone: "(66) 96551621" },
  { reg: "2308856", guardian: "MELRY LUANA BIZERRA PEREIRA", phone: "(66) 999070260" },
  { reg: "2191657", guardian: "ADRIELIA ALVES DA SILVA CIRILO", phone: "(66) 996772748 / (66) 996449609" },
  { reg: "2048360", guardian: "CLEUZA CALIXTO DE SOUZA", phone: "(66) 999805632 / (66) 996317666" },
  { reg: "2589370", guardian: "RENATA LIMA ARANHA", phone: "(66) 98396931 / (66) 996850561" },
  { reg: "2208534", guardian: "MARCIA CARVALHO PINHEIRO", phone: "(66) 996504001 / (66) 996153748" },
  { reg: "2614263", guardian: "BEATRIZ HONORATO FAGUNDES DE OLIVEIRA", phone: "(66) 999376868 / (66) 997113841" },
  { reg: "2601462", guardian: "ILDEANE MARTINS DA COSTA", phone: "(66) 992283745 / (66) 992146628" },
  { reg: "1974328", guardian: "NHAKMEYTI METUKTIRE", phone: "(66) 981295648 / (66) 996762008" },
  { reg: "2601591", guardian: "EDNEIA MIQUELETTI DA COSTA ROSA", phone: "(66) 996328508 / (66) 999024660" },
  { reg: "2580615", guardian: "ANA PAULA GONÇALVES FURLAN", phone: "(66) 996039396" },
  { reg: "2731779", guardian: "TALLYTA FEITOSA DA SILVA", phone: "(62) 981797974 / (64) 999248518" },
  { reg: "2599665", guardian: "SIMONE FERREIRA DOS SANTOS", phone: "(66) 997166787 / (66) 996920127" },
  { reg: "2597818", guardian: "SUELI CARDOSO DA CRUZ DOS SANTOS", phone: "(66) 996770246 / (66) 999942354" },
  { reg: "2208341", guardian: "CLEONICE DOS SANTOS CLEMENTINO", phone: "(66) 996531073 / (66) 996470099 / (65) 999163644" },
  { reg: "2595500", guardian: "MARCIA CRISTINA ALONSO", phone: "(66) 999728542 / (66) 997180768" },
  { reg: "2244544", guardian: "JOSE CÂNDIDO DE OLIVEIRA", phone: "(66) 999247902" },
  { reg: "2597303", guardian: "LARISSA DORINI", phone: "(66) 999587498 / (66) 996515318" },
  { reg: "2246485", guardian: "ROSANGELA DE OLIVEIRA SANTOS", phone: "(66) 995421698 / (66) 999251513" },
  { reg: "2208561", guardian: "ROSELI FELIZARDO DA SILVA BORGES", phone: "(66) 996621601 / (66) 999090956" },
  { reg: "2239392", guardian: "IRETXORAM METUKTIRE", phone: "(66) 984761924 / (66) 984400733" },
  { reg: "2137209", guardian: "ROSELI DA SILVA MARTINS", phone: "(66) 999674110" },
  { reg: "2599285", guardian: "DIANA ROBERT LEANDRO", phone: "(66) 996353798 / (66) 996347488" },
  { reg: "2722366", guardian: "RITA DE SOUZA CAETANO", phone: "(66) 985365888 / (99) 985315595" },
  { reg: "2142305", guardian: "ALESSANDRA SANTOS DA SILVA", phone: "(66) 990165205" },
  { reg: "2207882", guardian: "ANTONIO CARLOS DE OLIVEIRA BENTO", phone: "996940351 / 999940351" },
  { reg: "2581467", guardian: "EDINEIA DA SILVA SANTOS", phone: "(66) 996879389" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 7\u00ba ANO D ---');
  let count = 0;

  for (const item of contactsData) {
    const { error } = await supabase
      .from('students')
      .update({
        guardian_name: item.guardian.toUpperCase(),
        contact_phone: item.phone
      })
      .eq('registration_number', item.reg);

    if (error) {
      console.error(`\u274c Erro ao atualizar ${item.reg}:`, error.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  console.log(`\n\u2705 Sucesso: ${count} contatos atualizados.`);
}

syncContacts();
