const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2651735", guardian: "CRISLENE BARBOSA DA SILVA", phone: "(66) 98447-3525 / 98122-6531" },
  { reg: "2595180", guardian: "JOSIANE GOMES DOS SANTOS", phone: "(66) 99911-8659 / 99659-8766" },
  { reg: "2649923", guardian: "ANA CAROLINA MORAES LEONEL", phone: "(66) 98233-9201 / 99200-8579" },
  { reg: "2231709", guardian: "PATRICIA DIAS TOME", phone: "(66) 99616-9579 / 99955-8250" },
  { reg: "2223181", guardian: "JOSIANE APARECIDA FOCAS", phone: "(66) 99918-3498 / 98435-5898" },
  { reg: "2208540", guardian: "LUCILENE ELIZA DE SOUZA", phone: "(66) 98409-0656 / 99683-8491 / 99942-2883" },
  { reg: "2588048", guardian: "VANDERLEIA BENTO DA COSTA LIMA", phone: "(66) 98097-8755 / 99943-1656" },
  { reg: "2596515", guardian: "ANA PAULA DE SOUZA NICOLETI", phone: "(66) 99687-4249 / 99717-0608" },
  { reg: "2626709", guardian: "PAULA TAMIRES DA SILVA CRUZ", phone: "(66) 99906-6580 / 99635-9069" },
  { reg: "2651633", guardian: "JÉSSICA FLOR DA SILVA", phone: "(66) 98335-5246 / 98143-0969" },
  { reg: "2599606", guardian: "JULIETI BONETTI", phone: "(66) 99922-8272 / 99958-0090" },
  { reg: "2596783", guardian: "DÉBORA SILVÉRIO DUARTE", phone: "(66) 99975-0663" },
  { reg: "2595083", guardian: "VALDIRA NASCIMENTO", phone: "(66) 99205-5202 / 99959-9417 / 99693-9899" },
  { reg: "2587899", guardian: "GEANE CIRILO DOS SANTOS AMORIM", phone: "(66) 99983-0770" },
  { reg: "2651630", guardian: "JESSICA FLOR DA SILVA", phone: "(66) 98143-0969 / 98355-2465" },
  { reg: "2231294", guardian: "KETLLEN PEDROTTI PINTO", phone: "(66) 98455-0318 / 98985-8371" },
  { reg: "2405507", guardian: "ROBSON DO BEM", phone: "(66) 99850-5007" },
  { reg: "2208914", guardian: "SILVANEIA DA SILVA COSTA", phone: "(66) 99620-4755 / 99923-6924" },
  { reg: "2596601", guardian: "ANDREIA VIVIANE DO NASCIMENTO", phone: "(66) 99687-4249 / 99669-8765" },
  { reg: "2246470", guardian: "NAYARA GOMES PEREIRA", phone: "(66) 99628-1030 / 98224-1506" },
  { reg: "2580648", guardian: "DIESSICA NAIARA BITENCOURT DE SOUZA", phone: "(66) 99723-2529" },
  { reg: "2599033", guardian: "CLAUDENI JOSÉ DE SOUZA JACINTO", phone: "(66) 99096-5286 / 99648-8985" },
  { reg: "2596196", guardian: "LUCIANA DOS SANTOS DA SILVA", phone: "(66) 99723-1652 / 99615-8035" },
  { reg: "2600523", guardian: "PATRICIA TREVIZAN", phone: "(66) 98201-8975 / 99988-1001" },
  { reg: "2213860", guardian: "PATRICIA DE RAMOS DIAS", phone: "(66) 99987-7039 / 99957-5134" },
  { reg: "2596401", guardian: "JOVELINA GOMES DOS SANTOS LIMA", phone: "(66) 99963-6475" },
  { reg: "2600770", guardian: "ANDREIA PEREIRA DOS SANTOS", phone: "(66) 99633-7295" },
  { reg: "2600785", guardian: "ANDREIA PEREIRA DOS SANTOS", phone: "(66) 99633-7295" },
  { reg: "2604263", guardian: "MARIA APARECIDA DE FIGUEIREDO", phone: "(66) 99724-3015 / 99682-0068" },
  { reg: "2198238", guardian: "MARIA DE FATIMA DE SOUZA", phone: "(62) 99973-2723 / 98423-3607" }
];

async function syncContacts() {
  console.log('--- INICIANDO ATUALIZACAO DE CONTATOS 7\u00ba ANO A ---');
  let count = 0;

  for (const c of contactsData) {
    const { error } = await supabase
      .from('students')
      .update({
        guardian_name: c.guardian,
        contact_phone: c.phone
      })
      .eq('registration_number', c.reg);

    if (error) {
      console.error(`\u274c Erro ao atualizar ${c.reg}:`, error.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }
  console.log(`\n\u2705 Sucesso: ${count} contatos atualizados.`);
}

syncContacts();
