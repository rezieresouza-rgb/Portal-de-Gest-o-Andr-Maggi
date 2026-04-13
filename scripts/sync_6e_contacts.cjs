const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2674904", guardian: "DIANA DE SOUSA COSTA", phone: "(66) 99914-3038 / 99929-0019" },
  { reg: "2725279", guardian: "ROSANGELA DE FATIMA MOURA", phone: "(66) 99977-8125 / 99955-5334" },
  { reg: "2673457", guardian: "MOISES LUCAS ANDRADE", phone: "(66) 99910-5824" },
  { reg: "2350612", guardian: "ROSANGELA MOREIRA DOS SANTOS", phone: "(66) 98125-2076 / 98122-2032" },
  { reg: "2315761", guardian: "ERIKA PRISCILA DE ALMEIDA FERREIRA", phone: "(66) 99996-4415 / 99963-1089" },
  { reg: "2671297", guardian: "ANDREIA HENRIQUE DA SILVA", phone: "(66) 99638-3173 / 99603-1214" },
  { reg: "2693480", guardian: "MARCIA DUTRA DE SOUZA", phone: "(66) 99697-3927 / 99621-7298" },
  { reg: "2686851", guardian: "GEANE CIRILO DOS SANTOS AMORIM", phone: "(66) 99983-3770 / 98115-5650" },
  { reg: "2693387", guardian: "NOELMO MOREIRA DA SILVA", phone: "(66) 99633-8824 / 99935-4685" },
  { reg: "2671845", guardian: "LEIDIANE DOS SANTOS", phone: "(82) 9393-6391 / (82) 9157-6491 / (66) 99274-6577" },
  { reg: "2671253", guardian: "ABIGAIL MESQUITA SILVA", phone: "(66) 99922-7529 / 99726-3892" },
  { reg: "2421264", guardian: "TATIANA LOPES DA SILVA", phone: "(66) 99996-3626 / 99618-8757" },
  { reg: "2421444", guardian: "IRISNETH SOUZA LEITE", phone: "(66) 99982-0527" },
  { reg: "2673453", guardian: "JEDA DE SOUSA DOURADO", phone: "(66) 99904-4688 / 99638-7828" },
  { reg: "2721826", guardian: "REJANE BARBOSA LEMOS", phone: "(66) 99623-3739 / 99634-2405" },
  { reg: "2313125", guardian: "KELYANE DA SILVA VAZ", phone: "(66) 99656-8264 / 99716-8980" }, // Corrected last digit from image
  { reg: "2290250", guardian: "BEPTOTKRAN METUKTIRE", phone: "(66) 99915-7427 / 99717-7758" },
  { reg: "2277854", guardian: "LUCIANE BENEDITA CHAVES MENDONÇA", phone: "(66) 98404-4311 / 99684-2424" },
  { reg: "2297923", guardian: "PATRICIA DA SILVA FERREIRA", phone: "(66) 99713-5235 / 99996-9236" },
  { reg: "2671433", guardian: "SUELI CARDOSO DA CRUZ DOS SANTOS", phone: "(66) 99942-3547 / 99677-0246" },
  { reg: "2681047", guardian: "AURICELIA GONÇALVES VIANA", phone: "(66) 98127-5588" },
  { reg: "2673503", guardian: "CHYENNE DOS SANTOS CAVALCANTE RODRIGUES", phone: "(66) 99954-8627 / 99911-1863" },
  { reg: "2569399", guardian: "CAROLAINE ALMEIDA DOS SANTOS", phone: "(66) 99658-0890 / 99957-9150" },
  { reg: "2312384", guardian: "GRACIELI DOS SANTOS DA SILVA", phone: "(66) 99608-7605 / 99641-5588" },
  { reg: "2694555", guardian: "DALGIZE SOARES DA SILVA", phone: "(66) 98446-8933 / 98105-0277" },
  { reg: "2478383", guardian: "ADRIELSON DOS SANTOS MADEIRA", phone: "(66) 99933-8990" },
  { reg: "2349428", guardian: "VANIA DE FREIAS CUSTODIO", phone: "(11) 99597-9797" },
  { reg: "2721632", guardian: "ANDRESSA DOS SANTOS CORREA", phone: "(66) 99955-8652" },
  { reg: "2693981", guardian: "ELIZIANE APARECIDA DO NASCIMENTO DA SILVA PEDROSO", phone: "(66) 99670-8412 / 99687-5047" },
  { reg: "2338717", guardian: "ANGELA DO NASCIMENTO COSTA", phone: "(66) 98137-5610 / 98138-3875" },
  { reg: "2309740", guardian: "AMARILDA BEVENUTO RIBEIRO", phone: "(66) 99207-2286 / 98420-5720" }
];

async function syncContacts() {
  console.log('--- INICIANDO ATUALIZACAO DE CONTATOS 6\u00ba ANO E ---');
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
