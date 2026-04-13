const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const contactsData = [
  { reg: "2515838", guardian: "EDILAINE DE ARAUJO DA SILVA", phone: "(66) 999043526" },
  { reg: "2517940", guardian: "ROZILENE MATEUS", phone: "(66) 98728182" },
  { reg: "2517885", guardian: "ANNA PAULA BEZERRA DE SOUSA SANTOS", phone: "(66) 984209950" },
  { reg: "2139704", guardian: "JULIANA ALVES PEREIRA", phone: "(66) 992289174 / (66) 996577916" },
  { reg: "2048417", guardian: "JENNIFER LUNA DE OLIVEIRA", phone: "(66) 996088648 / (66) 996838709" },
  { reg: "2422873", guardian: "EDICLEIDE GALVÃO LOPES", phone: "(66) 996977754 / (PAI) 999858327" },
  { reg: "2137232", guardian: "JULIANA APARECIDA DA SILVA", phone: "(66) 999422441 / (66) 999857780 / (66) 984487607" },
  { reg: "2517888", guardian: "STEFANI REGINA SUTIL DOS SANTOS", phone: "(66) 996786633 / (66) 96793897" },
  { reg: "2517931", guardian: "WELINGTON RODRIGUES FRANÇA", phone: "(66) 996415618" },
  { reg: "2517919", guardian: "EDSON BEZERRA DA SILVA", phone: "(66) 996072233" },
  { reg: "2552429", guardian: "DEBORA PEREIRA DE SOUZA", phone: "(66) 992751607 / (66) 992945566" },
  { reg: "2153149", guardian: "SUELI MARIA DE ALMEIDA OLIVEIRA", phone: "(66) 996811527 / (66) 996812764" },
  { reg: "2426271", guardian: "KEURILANDIA SOUZA DE MELO", phone: "(97) 984308259" },
  { reg: "2522608", guardian: "ILVA DE JESUS CANGUÇU SANTOS", phone: "(66) 999033286 / (66) 996959450 / (66) 995434515" },
  { reg: "2439134", guardian: "ANA PAULA DE LIMA PEREIRA", phone: "(PAI) 996203710 / (66) 992381630" },
  { reg: "2137172", guardian: "ELIZA TAOMA SALVALAGIO", phone: "(66) 999069808" },
  { reg: "2167924", guardian: "ROMARIO LEMOS SATIL", phone: "(66) 996973597 / (66) 996993739 / (66) 996688730" },
  { reg: "2168508", guardian: "TATIANE FERNANDES LEME", phone: "(66) 996407433 / (66) 992625031" },
  { reg: "2137743", guardian: "JANAINA DA SILVA COSTA", phone: "(66) 98903802 / (66) 96935126 / (66) 99531813" },
  { reg: "2330432", guardian: "LARISSA DORINI", phone: "(66) 996515318 / (66) 999587498" },
  { reg: "2560541", guardian: "PATKORE METUKTIRE", phone: "(66) 996146603" },
  { reg: "2131934", guardian: "LUCIANE BENEDITA CHAVES MENDONÇA", phone: "(66) 996842424" },
  { reg: "2137196", guardian: "ADRIANA GONSALVES", phone: "(66) 999009215" },
  { reg: "2532702", guardian: "ELZA ALVES PIZZE", phone: "(AVÓ) 996010284" },
  { reg: "2524647", guardian: "LUANA SANTANA CARDOSO", phone: "(66) 992528783 / (66) 999648961" },
  { reg: "2157475", guardian: "VALDEIR FAUSTINO DOS SANTOS", phone: "98892083 / (66) 996495022 / (66) 999969029 / 999639043" },
  { reg: "2166695", guardian: "BEPDJORE METUKTIRE", phone: "(66) 999732147" },
  { reg: "2160248", guardian: "ELIZANGELA REIS DE SOUZA", phone: "(66) 996838592 / (66) 999209344" },
  { reg: "2290273", guardian: "BEPTOTKRAN METUKTIRE", phone: "(66) 997161818 / (66) 999769398" },
  { reg: "2422343", guardian: "DAIANE RODRIGUES", phone: "(66) 999391245 / (66) 996408864" }
];

async function syncContacts() {
  console.log('--- ATUALIZANDO CONTATOS 8\u00ba ANO D ---');
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
