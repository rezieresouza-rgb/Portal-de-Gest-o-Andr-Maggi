const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const names = [
  "YURY LINS DOS SANTOS MOTA",
  "MICHEL AZEVEDO PEREIRA",
  "MIGUEL AZEVEDO PEREIRA",
  "KALAN FEITOSA MORAES",
  "JOÃO LUCAS DE SOUZA DA SILVA",
  "DAVI LUCAS LIMA RODRIGUES",
  "WELBER LERRANDRO LOPES APARECIDO",
  "LEONEL FELIPE OLIVEIRA DOS SANTOS",
  "MARIA FERNANDA EQUIDONE MACHADO",
  "CRISLANE EDUARDA FARIAS DE ALMEIDA",
  "CRISLAINE VICTORIA FARIAS DE ALMEIDA",
  "ANA CLARA PEREIRA BRITO",
  "BEPET PANARA METUKTIRE",
  "ENZO ARTHUR DA SILVA SANTOS",
  "EMILY CRISTINA DO NASCIMENTO",
  "SABRINA VITORIA MATIAS MARTINS",
  "JOÃO GABRIEL DE OLIVEIRA MARTINS",
  "ISADORA CAETANO MATEUS",
  "MISAEL LUIZ DA SILVA DIAS",
  "JOÃO VITOR PEREIRA DA SILVA",
  "GUSTAVO HENRIQUE DE PAULA DE LARA",
  "JOÃO OTÁVIO GONSALVES DE LIMA",
  "GUILHERME SOUZA ALVES",
  "PAULA FERNANDA COIMBRA DA SILVA",
  "MIKAELY TIBURCIO SILVA",
  "IASMIM RAFAELA AMÂNCIO DE LIMA",
  "FELIPE NUNES DA SILVA",
  "FERNANDO DJARA TXUCARRAMÃE",
  "EMILLY VITÓRIA GOMES DOS SANTOS",
  "DAVI CARVALHO SALMENTO"
];

async function run() {
  let output = '';
  for (const name of names) {
    const { data, error } = await supabase
      .from('students')
      .select('registration_number, name')
      .ilike('name', `%${name.split(' ')[0]}%${name.split(' ')[name.split(' ').length - 1]}%`);
    output += `Searching for ${name}:\n${JSON.stringify(data, null, 2)}\n\n`;
  }
  fs.writeFileSync('tmp_out_utf8.txt', output, 'utf8');
}
run();
