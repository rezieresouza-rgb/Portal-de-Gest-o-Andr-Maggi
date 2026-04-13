const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2208354", guardian: "JOELMA BRITO DA SILVA", phone: "(66) 997208715 / (66) 999225341" },
  { reg: "2623156", guardian: "ANA CRISTINA PEREIRA DOS SANTOS", phone: "(99) 92183691 / (99) 981944670" },
  { reg: "2603223", guardian: "ANA PAULA SILVA SANTOS", phone: "(66) 996183058 / 998376677" },
  { reg: "2594697", guardian: "KELLY TEODORO DE OLIVEIRA PERES", phone: "(66) 992343255 / 992113305" },
  { reg: "2149607", guardian: "GISLAINY SOARES RODRIGUES", phone: "(66) 992183264" },
  { reg: "2600921", guardian: "GILIANE VIEIRA APARECIDO", phone: "(66) 997180605 / 999820876" },
  { reg: "2600464", guardian: "LINDIMARA APARECIDA GARCIA DOS SANTOS", phone: "(66) 981332288 / 996285325" },
  { reg: "2594780", guardian: "ELIZANGELA PEREIRA DOS SANTOS", phone: "(66) 999810250 / 996284331" },
  { reg: "2214165", guardian: "VALERIA TAMIRES SABOIA SOUZA RAMOS", phone: "(66) 999257252 / 998108684" },
  { reg: "2594979", guardian: "CRISTIANE DE OLIVEIRA RAMOS", phone: "(66) 996944271 / 995559903" },
  { reg: "2645141", guardian: "MARILENE APARECIDA DE SOUZA", phone: "(66) 997167629 / 999914189" },
  { reg: "2405266", guardian: "JHENIFA SIMÃO DA SILVA", phone: "(66) 996506436" },
  { reg: "2338472", guardian: "ERICA LOURENÇO LAGE", phone: "(66) 992489508 / 981048396" },
  { reg: "2417540", guardian: "KAREN CAROLINE SILVA DE SOUZA", phone: "(66) 981508428 / 981395550" },
  { reg: "2240478", guardian: "PATKARE TXUCARRAMÃE", phone: "(66) 984761924" },
  { reg: "2581600", guardian: "DEIZE CRISTINA STREB", phone: "(66) 996325991 / 999046114" },
  { reg: "2246251", guardian: "TATIANE GONÇALVES DA SILVA", phone: "(66) 996337508 / 999582178" },
  { reg: "2348896", guardian: "ELAINE SOARES SALES", phone: "(66) 984584151 / 984531621" },
  { reg: "2597454", guardian: "ROSÂNGELA DA SILVA ISABEL BRITO", phone: "(66) 996172629 / 992801551" },
  { reg: "2207895", guardian: "LEANDRO DE SOUZA LIMA", phone: "(66) 996960091 / 999111679" },
  { reg: "2600960", guardian: "RAQUEL DE FATIMA", phone: "(66) 996401288" },
  { reg: "2207901", guardian: "LEANDRO DE SOUZA LIMA", phone: "(66) 996960091 / 999111679" },
  { reg: "2603175", guardian: "ROSILENE RODRIGUES DOS SANTOS", phone: "(66) 997214140" },
  { reg: "2581604", guardian: "VIVIANA SALGO", phone: "(66) 999723885 / 996481962" },
  { reg: "2243589", guardian: "PATKORE METUKTIRE", phone: "(66) 999276493 / 996146603" },
  { reg: "2648005", guardian: "ELIANE PEREIRA GOMES", phone: "(92) 985121137" },
  { reg: "2210229", guardian: "DAIANE ARQUINO XAVIER", phone: "(66) 999409026" },
  { reg: "2596648", guardian: "HELENA OLIVEIRA MARINHO", phone: "(66) 996429121" },
  { reg: "2652310", guardian: "SILVIA CRISTINA DO NASCIMENTO", phone: "(17) 996083269" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 7\u00ba ANO B ---');
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
