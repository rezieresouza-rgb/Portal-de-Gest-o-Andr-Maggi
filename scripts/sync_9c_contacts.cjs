const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2416807", guardian: "EDINA SILVEIRA HESPER", phone: "(66) 984344006" },
  { reg: "2429791", guardian: "ERICA RAYANE DE SOUZA BARBOZA", phone: "(66) 984529537" },
  { reg: "2429741", guardian: "IDENE APARECIDA SILVERIO SANTOS", phone: "(66) 996241481" },
  { reg: "2429307", guardian: "YANE GRIZELIA GON\u00c7ALVES CARBO", phone: "(66) 999109549" },
  { reg: "2051268", guardian: "LUZIANE ANDRE DE OLIVEIRA SOUZA", phone: "(66) 996426721" },
  { reg: "2012675", guardian: "DEISI CAZARI CUBILHA", phone: "(66) 996951007" },
  { reg: "2007491", guardian: "IRENGRA NGRA METUKTIRE", phone: "(66) 996557532" },
  { reg: "2050177", guardian: "SILEIDI DE MELO SILVA", phone: "(66) 999077800" },
  { reg: "2200705", guardian: "ELIANE RODRIGUES DOS SANTOS COSTA", phone: "(66) 999630308" },
  { reg: "2053450", guardian: "MARCOS ANTONIO DA SILVAS", phone: "(66) 996692292" },
  { reg: "2429316", guardian: "ANA PAULA DE LIMA DAPPER", phone: "(66) 999785042" },
  { reg: "2343081", guardian: "ROSILENE DOS SANTOS", phone: "(66) 996816140" },
  { reg: "2429871", guardian: "MARIA REGINA DE SOUZA", phone: "(66) 996611311" },
  { reg: "2050836", guardian: "SILVANE MENDES FERREIRA", phone: "(66) 996457636" },
  { reg: "2429329", guardian: "MIRIAN HERICA BATISTA", phone: "(66) 995800378" },
  { reg: "2647514", guardian: "EDIELSON DA CONCEI\u00c7\u00c3O SOARES", phone: "(66) 991713131" },
  { reg: "2429802", guardian: "ANA PAULA DOS SANTOS", phone: "(66) 993891825" },
  { reg: "2343748", guardian: "ELIANE ALVES BARBOSA", phone: "(66) 981222814" },
  { reg: "2429335", guardian: "MARIA SALETE SANTOS DE SOUZA", phone: "(66) 996562581" },
  { reg: "2297927", guardian: "NUBIA SILVA DA COSTA", phone: "(66) 999150452" },
  { reg: "2195809", guardian: "ALEXANDRA FERREIRA", phone: "(66) 999436682" },
  { reg: "2429249", guardian: "LUCIMAR MARIA DA SILVA", phone: "(66) 999013536" },
  { reg: "2436376", guardian: "NEUZELI RODRIGUES DOS SANTOS", phone: "(66) 999346150" },
  { reg: "2725845", guardian: "JO\u00c3O DOS SANTOS COSTA", phone: "(66) 991326077" },
  { reg: "2436423", guardian: "MARIA APARECIDA DE AGUIAR", phone: "(66) 996337945" },
  { reg: "2429808", guardian: "LUCIANA DOS SANTOS DA SILVA", phone: "(66) 996766962" },
  { reg: "2591301", guardian: "ELIZANEA APARECIDA DE NOVAES", phone: "(66) 99315007" },
  { reg: "2050318", guardian: "MAIARA VEIGA DA SILVA", phone: "(66) 999333022" },
  { reg: "2429277", guardian: "ANA PAULA DE SOUZA NICOLETI", phone: "(66) 997170608" },
  { reg: "2430538", guardian: "CHIRLE APARECIDA DO NASCIMENTO", phone: "(66) 995820582" },
  { reg: "2429285", guardian: "NOELI CORDEIRO MARTINS", phone: "(66) 996881744" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 9\u00ba ANO C ---');
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
