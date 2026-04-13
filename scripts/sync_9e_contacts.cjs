const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2050582", guardian: "NEIDYANE BEZERRA DA SILVA", phone: "(66) 996024844" },
  { reg: "2050276", guardian: "AMELIA CARDOSO DA SILVA", phone: "(66) 997184232" },
  { reg: "2437739", guardian: "ELIANE MENDES DOS SANTOS", phone: "(66) 999147587" },
  { reg: "2436577", guardian: "CAROLINE FIERI PINTO", phone: "(66) 999661414" },
  { reg: "2436528", guardian: "MARIA DAS GRA\u00c7AS RIBEIRO DE OLIVEIRA", phone: "(66) 996716091" },
  { reg: "2429308", guardian: "GABRIELA DORINI PEREIRA", phone: "(66) 999173070" },
  { reg: "2048569", guardian: "MARIA APARECIDA CASSIMIRO", phone: "(66) 993466135" },
  { reg: "2489093", guardian: "DANIELA DOS SANTOS SOARES", phone: "(66) 996238637" },
  { reg: "1983765", guardian: "LUSIVANIA MARTINS DA COSTA", phone: "(66) 996324264" },
  { reg: "2035427", guardian: "JOS\u00c9 CARLOS GIZONI", phone: "(66) 996631343" },
  { reg: "2429314", guardian: "MICHELI TONON MOREIRA", phone: "(66) 999580430" },
  { reg: "2050211", guardian: "MARIA IZABEL ALVES BISPO", phone: "(66) 996917178" },
  { reg: "2429327", guardian: "MARIZE DOS SANTOS BORGES", phone: "(66) 996781934" },
  { reg: "1991538", guardian: "KARAXU METUKTIRE", phone: "(66) 999088730" },
  { reg: "2342762", guardian: "GILVANI SANITA CANGU\u00c7U", phone: "(66) 996025121" },
  { reg: "2043254", guardian: "REGINALDO PEREIRA NETO", phone: "(66) 996084478" },
  { reg: "2140547", guardian: "ROSANGELA SALGADO RIBEIRO", phone: "(66) 996459392" },
  { reg: "2417324", guardian: "KATIA AUGUSTO", phone: "(66) 999201502" },
  { reg: "2053612", guardian: "GISMAR ANT\u00d4NIO SERDEIRA", phone: "(66) 999665673" },
  { reg: "1989168", guardian: "ANTONIA DA SILVA DE SOUZA", phone: "(66) 999671569" },
  { reg: "2429340", guardian: "FABIANA BACHIEGA DA COSTA", phone: "(66) 996584218" },
  { reg: "2429251", guardian: "CRISTIANO SANTOS PRADO", phone: "(66) 996323675" },
  { reg: "2048425", guardian: "ELITON DA COSTA FERREIRA", phone: "(66) 996558434" },
  { reg: "2429250", guardian: "JO\u00c3O RICARDO DE SANTANA", phone: "(66) 999203607" },
  { reg: "2051329", guardian: "ELISANGELA DE ANDRADE SOARES", phone: "(66) 996849852" },
  { reg: "2045918", guardian: "VERA LUCIA BATISTA", phone: "(66) 999208070" },
  { reg: "2429282", guardian: "ELIANE SANTOS CAVALCANTE", phone: "(66) 996884940" },
  { reg: "2439390", guardian: "SIDINEIA CAZELATO", phone: "(66) 996631131" },
  { reg: "2436792", guardian: "SOLANGE FREITAS WEIDLICH", phone: "(66) 996541408" },
  { reg: "2048360", guardian: "ADRIAM BATISTA BIFI", phone: "(66) 992523062" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 9\u00ba ANO E ---');
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
      console.error(`\u274c Erro ${c.reg}:`, error.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  console.log(`\n\u2705 Sucesso: ${count} contatos atualizados.`);
}

syncContacts();
