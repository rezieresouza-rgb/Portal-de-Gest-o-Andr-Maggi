const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const updates = [
  { name: "ANA CLARA PEREIRA BRITO", guardian_name: "EDICLEIA BRITO PEDROSO", contact_phone: "(66) 996521889 / (66) 997108214" },
  { name: "DEPICI PAWARA METUKTIRE", guardian_name: "IRENGPRANGA METUKTIRE", contact_phone: "(66) 996557632 / (66) 996047063" },
  { name: "CRISLAINE VICTORIA FARIAS DE ALMEIDA", guardian_name: "VALDEREZ FARIAS DA SILVA", contact_phone: "(66) 999585311 / (66) 999492264" },
  { name: "CRISTIANE EDUARDA FARIAS DE ALMEIDA", guardian_name: "VALDEREZ FARIAS DA SILVA", contact_phone: "(66) 999585311 / (66) 999492264" },
  { name: "DAVI CARVALHO SARMENTO", guardian_name: "GEOVANE CARVALHO", contact_phone: "(66) 992160352 / (66) 992283624" },
  { name: "DAVI LUCAS LIMA RODRIGUES", guardian_name: "LAURA DOS SANTOS LIMA", contact_phone: "(66) 996614138 / (66) 35411036" },
  { name: "EMILLY VITÓRIA GOMES DOS SANTOS", guardian_name: "GISELE GOMES DE CARVALHO", contact_phone: "(66) 996366556 / (66) 999127371" },
  { name: "EMILY CRISTINA DO NASCIMENTO", guardian_name: "LEILA CRISTINA DOS ANDRADE NASCIMENTO", contact_phone: "(66) 999711126 / (66) 996723335" },
  { name: "ENZO ARTHUR DA SILVA SANTOS", guardian_name: "GEILZA GOMES DA SILVA", contact_phone: "(66) 999149217 / (66) 999078454" },
  { name: "FELIPE NUNES DA SILVA", guardian_name: "JHENIFER SIMÃO DA SILVA", contact_phone: "(66) 996504361 / (66) 996340571" },
  { name: "FERNANDO DJARA TXUCAIRRAMAE", guardian_name: "ROIU METUKTIRE", contact_phone: "(66) 996454127 / (66) 999540412" },
  { name: "GUILHERME SOUZA ALVES", guardian_name: "LEIA PEIXOTO DE SOUZA", contact_phone: "(66) 996427075 / (66) 997151511" },
  { name: "GUSTAVO HENRIQUE DE PAULA DE LARA", guardian_name: "CELSO MELO DE LARA", contact_phone: "(66) 999583002" },
  { name: "ISADORA CAETANO MATEUS", guardian_name: "JESSICA CAETANO DOS SANTOS", contact_phone: "(66) 999132683 / (66) 999542065" },
  { name: "JASMIN RAFAELA AMÂNCIO DE LIMA", guardian_name: "JANAINA AMÂNCIO DA SILVA", contact_phone: "(66) 996871032 / (66) 992140332" },
  { name: "JOÃO GABRIEL DE OLVEIRA MARTINS", guardian_name: "JAQUELINE COELHA DE OLIVEIRA", contact_phone: "(66) 996655550 / (66) 997183351" },
  { name: "JOÃO LUCAS DE SOUZA DA SILVA", guardian_name: "MARIA ELIANE DE SOUZA", contact_phone: "(66) 996162125 / (66) 996409819" },
  { name: "JOÃO OTÁVIO GONSALVES DE LIMA", guardian_name: "ADRIANA GONÇALVES", contact_phone: "(66) 997230215" },
  { name: "JOÃO VITOR PEREIRA DA SILVA", guardian_name: "LUCIMAR PEREIRA SANDES", contact_phone: "(66) 996888859" },
  { name: "KAUAN DIOGO MORAES", guardian_name: "GESSIANE SOUZA FEITOSA", contact_phone: "(66) 992640521" },
  { name: "LEONEL FELIPE OLIVEIRA DOS SANTOS", guardian_name: "VALERIA OLIVEIRA MARINHO", contact_phone: "(66) 34135374 / (66) 996429101" },
  { name: "MARIA FERNANDA FOUQUET MACHADO", guardian_name: "ALEXANDRE JUNIOR MACHADO", contact_phone: "(66) 999919790 / (66) 996457958" }
];

async function updateStudents() {
  for (const update of updates) {
    const { data, error } = await supabase
      .from('students')
      .update({
        guardian_name: update.guardian_name,
        contact_phone: update.contact_phone
      })
      .ilike('name', update.name);

    if (error) {
      console.error(`Error updating student ${update.name}:`, error.message);
    } else {
      console.log(`Updated successfully: ${update.name}`);
    }
  }
}

updateStudents();
