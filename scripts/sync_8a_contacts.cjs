const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2538543", guardian: "RAFAELA DOS SANTOS", phone: "(66) 999362980 / (AVÓ) 996789753" },
  { reg: "2137410", guardian: "MARCIA CARVALHO PINHEIRO", phone: "(66) 996804001 / (66) 996153748" },
  { reg: "2522551", guardian: "REGINALVA MENDES SANTANA", phone: "(66) 999527898" },
  { reg: "2517846", guardian: "CLEIDIANE ALVES DE MELO", phone: "(66) 999826309" },
  { reg: "2136684", guardian: "JULIANA GOMES DE BRITO MARQUES", phone: "(66) 997137241 / (66) 999044668" },
  { reg: "2168493", guardian: "ADRIANA DIONISIO FIGUEREDO TONIATO", phone: "(66) 999124562 / (66) 996050638" },
  { reg: "2645898", guardian: "BETTY DEL VALLE GUZMAN RODRIGUEZ", phone: "(095) 991523501" },
  { reg: "2050585", guardian: "LUIZ CARLOS DE BRITO", phone: "(66) 984201291" },
  { reg: "2288971", guardian: "ANGELA DAS GRAÇAS FROIS SANITA", phone: "(66) 999563447 / (66) 999018698" },
  { reg: "2536878", guardian: "JUSSARA MARTINS RODRIGUES", phone: "(66) 996466190" },
  { reg: "2137918", guardian: "MARINALVA MARIA DA SILVA", phone: "(66) 997145608" },
  { reg: "2250607", guardian: "JOCELI APARECIDA GONSALVES", phone: "(66) 991999951 / (66) 99105765" },
  { reg: "2517841", guardian: "LUCIANA APARECIDA DOS SANTOS", phone: "(66) 996850053" },
  { reg: "2136598", guardian: "MARIA APARECIDA MANTOVANI", phone: "(66) 999674546 / (66) 996469622" },
  { reg: "2522390", guardian: "CRISTINA FIDELIS MOURA", phone: "(66) 999438915" },
  { reg: "2517807", guardian: "TATIANE FERNANDES DA SILVA", phone: "(66) 984210661 / (PAI) 999570425" },
  { reg: "2069781", guardian: "CRISTIANE DOS SANTOS NUNES", phone: "(66) 996508436 / (66) 996143402" },
  { reg: "2406028", guardian: "ANGELICA AMORIM LOPES", phone: "(66) 997185824 / (66) 996802706" },
  { reg: "491301", guardian: "MARCELA NONATA AZEVEDO DE SOUZA", phone: "(66) 997203781" },
  { reg: "2151057", guardian: "JESSICA LANGRAF DE REZENDE", phone: "(66) 996864700 / (66) 999818301" },
  { reg: "2464953", guardian: "RAQUEL FÁTIMA SANTOS", phone: "(66) 999177954 / (66) 996401288" },
  { reg: "2136789", guardian: "JOÃO CARLOS DA CONCEIÇÃO SANTOS", phone: "(66) 998344808 / (66) 996718528" },
  { reg: "2137101", guardian: "LUCIANA HELENA DIAS SAMPAIO SILVA", phone: "(66) 996820270 / (67) 992398056" },
  { reg: "2523030", guardian: "LUZIA DOS SANTOS MADEIRA", phone: "(66) 996179695" },
  { reg: "2517936", guardian: "ROSILDA DUTRA FAUSTINO", phone: "(66) 999687910 / (66) 999149280" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 8\u00ba ANO A ---');
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
