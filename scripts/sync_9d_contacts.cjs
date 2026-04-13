const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2436145", guardian: "DULCIMARA MARTINS REBUSSI", phone: "(66) 999118847" },
  { reg: "2235064", guardian: "CLEBER JOSE DA SILVA", phone: "(66) 996366605" },
  { reg: "2057496", guardian: "MARIA ALBERLANDIA DOMINGOS", phone: "(66) 999972830" },
  { reg: "2343688", guardian: "CELIANE CARDOSO DOS SANTOS", phone: "(66) 992039507" },
  { reg: "2328374", guardian: "AMARILDA BEVENUTO RIBEIRO", phone: "(66) 992072286" },
  { reg: "2482022", guardian: "ROSICLEIDE NEVES DE SOUZA BACHIEGA", phone: "(66) 99477756" },
  { reg: "2105151", guardian: "ZENI DE ARAUJO GONSALVES", phone: "(66) 999105765" },
  { reg: "2452301", guardian: "MARCIA CRISTINA ALONSO", phone: "(66) 997180768" },
  { reg: "2396159", guardian: "SILMARA MOREIRA DA SILVA", phone: "(66) 996525723" },
  { reg: "2499840", guardian: "DULCE APARECIDA MACHADO LEITE", phone: "(66) 999710474" },
  { reg: "2169362", guardian: "EVELINE ALVES DOS SANTOS", phone: "(66) 992227936" },
  { reg: "1977496", guardian: "EDNA DA SILVA MARTINS", phone: "(66) 999574110" },
  { reg: "1684109", guardian: "PATKORE METUKTIRE", phone: "" },
  { reg: "2048893", guardian: "JAIR ANTONIO DA SILVA", phone: "(66) 999875945" },
  { reg: "2436046", guardian: "IVANETE JOS\u00c9 DA SILVA SOUZA COSTA", phone: "(66) 999588184" },
  { reg: "2436081", guardian: "FABIANA OLIVEIRA BARROS", phone: "(66) 999321096" },
  { reg: "2113039", guardian: "ELIZANGELA REIS DE SOUZA", phone: "(66) 999209344" },
  { reg: "2298572", guardian: "EDINA PERTELI", phone: "(66) 996683800" },
  { reg: "2048598", guardian: "CELMA BARBOSA ALVES", phone: "(66) 996494407" },
  { reg: "2050704", guardian: "MARIA LUCIANA DE SOUZA", phone: "(66) 997139238" },
  { reg: "2097232", guardian: "LUCIANA GONZAGA DOS SANTOS", phone: "(66) 999092457" },
  { reg: "2057543", guardian: "ALEX CARLOS NOGUEIRA", phone: "(66) 999297344" },
  { reg: "2429260", guardian: "ROSIMEIRE VIEIRA DA SILVA", phone: "(66) 996498250" },
  { reg: "2413160", guardian: "FRANCIELE MAY", phone: "(66) 999966785" },
  { reg: "2044686", guardian: "ANG\u00c9LICA DOS SANTOS OLIVEIRA DA SILVA", phone: "(66) 997107717" },
  { reg: "2051314", guardian: "ANA PAULA DOS SANTOS", phone: "(66) 996623881" },
  { reg: "2343118", guardian: "ROSEMARA RODRIGUES DOS REIS", phone: "(66) 996848940" },
  { reg: "2087068", guardian: "MARIA DE FATIMA RIBEIRO DO NASCIMENTO", phone: "(66) 999153885" },
  { reg: "2437184", guardian: "FABIANA NUNES DE ALMEIDA", phone: "(66) 996113636" },
  { reg: "2085176", guardian: "TXUAKRE METUKTIRE", phone: "(66) 996954970" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 9\u00ba ANO D ---');
  let count = 0;

  for (const c of contactsData) {
    const { error } = await supabase
      .from('students')
      .update({
        guardian_name: c.guardian.toUpperCase(),
        contact_phone: c.phone || null
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
