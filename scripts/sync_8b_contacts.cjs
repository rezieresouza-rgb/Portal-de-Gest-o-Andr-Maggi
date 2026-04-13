const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2235168", guardian: "ELIANE OLIVEIRA DA PAIXÃO", phone: "(66) 999272477 / (66) 999014871" },
  { reg: "2270899", guardian: "ROSILAINE FIEL BRITO", phone: "(66) 999152491" },
  { reg: "2519067", guardian: "ELIZANGELA GONÇALVES MACHADO", phone: "(66) 999683544" },
  { reg: "2166814", guardian: "ROSIMAR GUIMARÃES", phone: "(66) 996803894" },
  { reg: "2197774", guardian: "EDILENE DUARTE", phone: "(66) 984403115 / (66) 996455018" },
  { reg: "2659835", guardian: "VANESSA GONÇALVES DA SILVA", phone: "(45) 988440168" },
  { reg: "1977590", guardian: "ROSIVANI PEREIRA DE SÁ", phone: "(66) 996401387 / (66) 999785295" },
  { reg: "2364199", guardian: "LUCIANE LOPES CARVALHO", phone: "(66) 996900705 / (66) 997251480" },
  { reg: "2136816", guardian: "KELI MARA SOARES MEIRA", phone: "(66) 999966275 / (66) 996359967" },
  { reg: "2151648", guardian: "ROSANGELA DA SILVA", phone: "(66) 996391721 / (66) 996260944" },
  { reg: "2136664", guardian: "INESITA APARECIDA PONCIO", phone: "(66) 996065516 / (66) 999346579" },
  { reg: "2538192", guardian: "ADRIANA RODRIGUES DOS SANTOS", phone: "(66) 992093009 / (66) 999295744" },
  { reg: "2526597", guardian: "WALLACE JUNQUEIRA RODRIGUES", phone: "(66) 984586367 / (AVÓ) 999553896" },
  { reg: "2137183", guardian: "SIMONE PAÇOS DOS SANTOS", phone: "(66) 999190564 / (66) 999860696" },
  { reg: "2651767", guardian: "CRISLENE BARBOSA DA SILVA", phone: "(099) 984873525 / (099) 981226531" },
  { reg: "2137589", guardian: "LUCIMAR PEREIRA SANDES", phone: "(66) 997181042 / (66) 997181042" },
  { reg: "2137425", guardian: "TÂNIA FRANCIELEN DA SILVA PINTO DE FREITAS", phone: "(66) 996851264" },
  { reg: "2623273", guardian: "CLEI REGINA DE CARVALHO MARQUES", phone: "(69) 99338588 / (97) 981109361" },
  { reg: "2632831", guardian: "MAIARA DO NASCIMENTO MENDES", phone: "(99) 991491939 / (99) 985233496" },
  { reg: "2545654", guardian: "DHYOVANI GARCIA LEAL", phone: "(66) 996337060 / (66) 999579292" },
  { reg: "2137484", guardian: "NEURANI CAMARGO LEITE CARLOS", phone: "(66) 996012856 / (66) 996129630" },
  { reg: "2412301", guardian: "NATALINA NOVAIS", phone: "(66) 996562311 / (66) 992427832" },
  { reg: "2137142", guardian: "GRACILENE NASCIMENTO ALBANO", phone: "(66) 999888462 / (66) 996948439" },
  { reg: "2031995", guardian: "CLAUDEMIR DA SILVA OLIVEIRA", phone: "(66) 996494918 / (66) 996082553" },
  { reg: "2163564", guardian: "PATRICIA DA SILVA FERREIRA", phone: "(66) 997139238 / (PAI) 999969235" },
  { reg: "2522483", guardian: "TERESA GIMENES SOUZA", phone: "(AVÓ) 996689601" },
  { reg: "2534878", guardian: "THYAGO BRITO DE OLIVEIRA", phone: "(66) 991044730 / (66) 991397768" },
  { reg: "2136648", guardian: "DAIANE NEVES DA SILVA", phone: "(66) 999073142 / (66) 996375400 / (66) 999267084" },
  { reg: "2523836", guardian: "LURDES COSER", phone: "(66) 996556830" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 8\u00ba ANO B ---');
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
