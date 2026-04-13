const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2596598", guardian: "ANGELITA LOPES CORBALAN", phone: "(66) 999008433 / (TIA) 992537598" },
  { reg: "2244517", guardian: "ELIZABETH GONÇALVES ROCHA PESSOA DE CARVALHO", phone: "(66) 996782045 / (66) 996500332" },
  { reg: "2208348", guardian: "SANDRO RIBEIRO DOS ANJOS", phone: "(66) 984518578" },
  { reg: "2136344", guardian: "MAYARA BARBOZA DA CRUZ", phone: "(66) 984221267" },
  { reg: "2420336", guardian: "MATUDJO METUKTIRE", phone: "(66) 992171385" },
  { reg: "2208334", guardian: "ELAINE ZANOVELLO", phone: "(66) 999875945 / (66) 996404145" },
  { reg: "2722312", guardian: "RITA SOUZA CAETANO", phone: "(99) 985365888 / (99) 985315595" },
  { reg: "2213985", guardian: "ELISANGELA ALVES DA SILVA", phone: "(66) 99814846 / (66) 999777645" },
  { reg: "2228554", guardian: "TAKATUM METUKTIRE", phone: "(66) 35752265 / (66) 999443578" },
  { reg: "2604723", guardian: "DANGELY RODRIGUES CAMPOS", phone: "(91) 91141806" },
  { reg: "2623793", guardian: "MAGNÓLIA DE OLIVEIRA SILVA", phone: "(66) N/A" },
  { reg: "2613255", guardian: "GEICIANE VILLA", phone: "(66) 996900274 / (66) 997195321" },
  { reg: "2601238", guardian: "YARA FERNANDA DE OLIVEIRA", phone: "(66) 999283474 / (66) 999001333" },
  { reg: "2246483", guardian: "SIMONE BATISTA GONSALVES", phone: "(66) 999195539" },
  { reg: "2631278", guardian: "GABRIELI RAMOS DOS SANTOS", phone: "(66) 999687332 / (TIA) 992754168" },
  { reg: "2413159", guardian: "FRANCIELE MAY", phone: "(66) 999966785" },
  { reg: "2601671", guardian: "PAIMU MUAPEP TRUMAI TXUCARRAMÃE", phone: "(66) 996790350" },
  { reg: "2352757", guardian: "CAROLINE ALBINO DA SILVA", phone: "(66) 996692930 / (66) 999320904" },
  { reg: "2203137", guardian: "JANAINA AMÂNCIO DA SILVA", phone: "(81) 983942373 / (66) 992325682" },
  { reg: "2601426", guardian: "RAQUEL SILVEIRA MARTINS", phone: "(66) 999271069 / (66) 999712130" },
  { reg: "2370537", guardian: "WELLINGTA FLORES CRUZ", phone: "(66) 999575947" },
  { reg: "2418734", guardian: "MARIA CRISTINA DE OLIVEIRA MEDEIROS", phone: "(66) 999239313 / (66) 996831715" },
  { reg: "2537653", guardian: "MINGAU METUKTIRE", phone: "(66) 984401990 / (66) 984400733" },
  { reg: "2603427", guardian: "NHAKMEYTI METUKTIRE", phone: "(66) 981295648" },
  { reg: "2604711", guardian: "TATIELE DE JESUS CARVALHO", phone: "(66) 992466566" },
  { reg: "2623157", guardian: "ANTÔNIO RODRIGUES DOS SANTOS", phone: "(66) 996125050 / (66) 996023978" },
  { reg: "2208483", guardian: "AMANDA MARIA LIMA QUEIROZ", phone: "(66) 996463339 / (66) 996464210" },
  { reg: "2258234", guardian: "ILDA SALETE PINTO", phone: "(66) 992028530" },
  { reg: "2207809", guardian: "JANETE DA SILVA MACHADO", phone: "(66) 999155010 / (66) 999955044" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 7\u00ba ANO E ---');
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
