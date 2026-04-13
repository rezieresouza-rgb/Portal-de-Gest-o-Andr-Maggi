const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2139797", guardian: "ROSALINA SOARES", phone: "(66) 99908-1173 / 99680-4832" },
  { reg: "2542199", guardian: "GABRIELA SABRINA DE ALMEIDA", phone: "(66) 99940-4328" },
  { reg: "2084492", guardian: "BAPJAKATI METUKTIRE", phone: "(66) 99613-7194 / 99654-2434" },
  { reg: "2090754", guardian: "BEPNHI METUKTIRE", phone: "(66) 99256-244" },
  { reg: "2137816", guardian: "ELIZABETE MOREIRA DA SILVA LUIZ", phone: "(66) 99655-9437 / 99951-9364" },
  { reg: "2048360", guardian: "CLEUZA CALIXTO DE SOUZA", phone: "(66) 99680-5632 / 99631-7666" },
  { reg: "2169180", guardian: "ANTONIA LIMA SOUZA", phone: "(66) 99698-1414 / 99220-9771 / 99963-0208" },
  { reg: "2523989", guardian: "MIRIAN REGINA MATTOS DE QUEIROZ", phone: "(66) 99932-0071 / 99935-8964" },
  { reg: "2268719", guardian: "JERCIANE DE FREITAS SOARES", phone: "(66) 99684-4806 / 99307-576" },
  { reg: "2522509", guardian: "EDNA SANT ANA", phone: "(66) 99904-9928" },
  { reg: "2137088", guardian: "LEILIANE ARAUJO", phone: "(66) 99678-9721 / 99914-7073" },
  { reg: "2550684", guardian: "SIMONE RODRIGUES DOS SANTOS DA COSTA", phone: "(66) 99224-7697 / 99227-2771" },
  { reg: "2574458", guardian: "NILTON MARCELINO BORGES", phone: "(66) 98133-5809 / 98106-1770" },
  { reg: "2537496", guardian: "DAIANE MAIARA FURLAN", phone: "(66) 99719-8961 / 99922-8576" },
  { reg: "2514154", guardian: "REGIANE ALVES DE SOUZA", phone: "(66) 99973-4364 / 99983-7117" },
  { reg: "2047417", guardian: "ANDRESSA DOS SANTOS CORRÊA", phone: "(66) 99955-8652" },
  { reg: "2147945", guardian: "PRISCILA VANESSA NOVACK SILVA", phone: "(66) 99651-7655 / 98400-3088 / 99502-7948" },
  { reg: "2421261", guardian: "TATIANA LOPES DA SILVA", phone: "(66) 99941-1894" },
  { reg: "2048521", guardian: "DEBORA GONÇALO DOS SANTOS", phone: "(66) 9805-7018 / 99624-9864" },
  { reg: "2623273", guardian: "CLEI REGINA DE CARVAHO MARQUES", phone: "(66) 99338-588 / (97) 98110-9361" },
  { reg: "2193620", guardian: "NANGRA TAPAYUNA", phone: "(66) 99903-7543 / 99281-8837" },
  { reg: "2555038", guardian: "MARCIA DA CONCEIÇÃO ARAUJO", phone: "(66) 99687-5529" },
  { reg: "2512787", guardian: "BRUNA MONTIEL SALVATO", phone: "(66) 99302-624 / 99988-5150 / 99654-2959" },
  { reg: "2528956", guardian: "GENECI QUEILA BARBOSA SANTOS", phone: "(66) 99691-1271" },
  { reg: "2555059", guardian: "MARCIA DA CONCEIÇÃO ARAUJO", phone: "(66) 99687-5529" },
  { reg: "2464953", guardian: "RAQUEL FÁTIMA SANTOS", phone: "(66) 99917-7954 / 99640-1288" },
  { reg: "2565522", guardian: "REINALDO DE OLIVEIRA SANTOS", phone: "(66) 99570-3099 / 99682-5981 / 99910-3436" },
  { reg: "2551541", guardian: "CREIDE FRANCISCA RAMOS", phone: "(66) 99905-8567 / 98889-3992" },
  { reg: "2071452", guardian: "CLAUDIA DE OLIVEIRA MARTINI", phone: "(66) 99996-9422 / 99979-1992" },
  { reg: "2167703", guardian: "DANIELA GARCIA DA SILVA", phone: "(66) 99648-8754 / 99944-2927" },
  { reg: "2137132", guardian: "ENEAS UCHOA DE AMORIM", phone: "(66) 99911-6835 / 99675-9477" },
  { reg: "2133636", guardian: "DAYANE SABRINA BRITO DE SOUSA", phone: "(66) 99718-6212 / 98810-5246 / 99616-1204" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 8\u00ba ANO E ---');
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
