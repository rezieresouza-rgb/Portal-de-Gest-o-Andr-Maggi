const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'sb_publishable_ShynnkPdqbx5Zzr0phpUHQ_L9s6LSy-';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_PERMISSIONS = {
  'GESTAO': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'psychosocial', 'mediacao', 'pedagogical', 'teacher', 'scheduling', 'library', 'almoxarifado', 'limpeza', 'infraestrutura', 'patrimonio', 'special_education', 'civico_militar', 'training', 'educarte', 'settings', 'gamification'],
  'ADMINISTRADOR': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'psychosocial', 'mediacao', 'pedagogical', 'teacher', 'scheduling', 'library', 'almoxarifado', 'limpeza', 'infraestrutura', 'patrimonio', 'special_education', 'civico_militar', 'training', 'educarte', 'settings', 'gamification'],
  'DIRETOR': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'psychosocial', 'mediacao', 'pedagogical', 'teacher', 'scheduling', 'library', 'almoxarifado', 'limpeza', 'infraestrutura', 'patrimonio', 'special_education', 'civico_militar', 'training', 'educarte', 'settings', 'gamification'],
  'COORDENADOR PEDAGÓGICO': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'psychosocial', 'mediacao', 'pedagogical', 'teacher', 'scheduling', 'library', 'almoxarifado', 'limpeza', 'infraestrutura', 'patrimonio', 'special_education', 'civico_militar', 'training', 'educarte', 'gamification'],
  'SECRETÁRIO': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'infraestrutura', 'special_education', 'civico_militar', 'training', 'educarte', 'gamification'],
  'SECRETARIA': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'infraestrutura', 'special_education', 'civico_militar', 'training', 'educarte', 'gamification'],
  'PROFESSOR': ['teacher', 'scheduling', 'library', 'almoxarifado', 'civico_militar', 'training', 'mediacao', 'educarte', 'gamification'],
  'REGÊNCIA': ['teacher', 'scheduling', 'training', 'gamification'],
  'PSICOSSOCIAL': ['psychosocial', 'mediacao', 'busca_ativa', 'scheduling', 'special_education', 'teacher', 'training', 'educarte', 'gamification'],
  'MEDIADOR': ['psychosocial', 'mediacao', 'busca_ativa', 'scheduling', 'special_education', 'teacher', 'training', 'educarte', 'gamification'],
  'OFICIAL DE GESTÃO CIVICO-MILITAR': ['civico_militar', 'scheduling', 'training', 'educarte'],
  'GESTOR EDUCACIONAL MILITAR': ['civico_militar', 'scheduling', 'training', 'educarte'],
  'MONITOR': ['civico_militar', 'scheduling', 'training', 'educarte'],
  'BUSCA ATIVA': ['busca_ativa', 'secretariat', 'educarte'],
  'BIBLIOTECA': ['library', 'scheduling'],
  'LIMPEZA': ['limpeza', 'training'],
  'MANUTENCAO': ['infraestrutura', 'limpeza', 'training'],
  'AAE': ['merenda', 'limpeza', 'almoxarifado', 'training'],
  'AAE_LIMPEZA': ['limpeza', 'almoxarifado', 'training'],
  'AEE_NUTRICAO': ['merenda', 'almoxarifado', 'training'],
  'NUTRIÇÃO': ['merenda', 'training'],
  'TAE': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'infraestrutura', 'special_education', 'civico_militar', 'training', 'educarte'],
  'AUXILIAR DE PÁTIO': ['training', 'educarte'],
  'AUXILIAR DE COORDENAÇÃO PEDAGÓGICA': ['pedagogical', 'scheduling', 'training', 'educarte'],
  'ASSISTENTE DE EDUCAÇÃO ESPECIAL': ['special_education', 'training'],
  'APA': ['special_education', 'training'],
  'SALA DE RECURSOS': ['special_education', 'training'],
  'LABORATÓRIO DE CIÊNCIAS': ['scheduling', 'training'],
  'VIGIA': ['training']
};

const ALL_MODULES = [
  'secretariat', 'merenda', 'finance', 'busca_ativa', 'mediacao', 'psychosocial',
  'pedagogical', 'teacher', 'scheduling', 'library', 'almoxarifado', 'limpeza',
  'infraestrutura', 'patrimonio', 'special_education', 'civico_militar', 'educarte',
  'training', 'gamification', 'settings'
];

function getModulesForUser(user) {
  const name = (user.name || '').toUpperCase();
  const cpf = (user.cpf || '').replace(/\\D/g, '');
  const jobFunction = (user.job_function || user.role || '').trim().toUpperCase();

  const isAdmin = jobFunction === 'GESTAO' || jobFunction === 'ADMINISTRADOR';

  // Specific restrictions
  if (name.includes('LUZIA')) return ['scheduling', 'library'];
  if (name.includes('KAMILA DA SILVA SANTOS') || cpf === '04713754110') return ['teacher', 'scheduling'];
  if (name.includes('BRUNA') || cpf === '06185250179') return ['teacher', 'scheduling', 'training'];
  if (name.includes('EDNA DA MATTA TIROLTI') || cpf === '63148480163') return ['teacher', 'scheduling', 'training', 'gamification'];
  if (name.includes('GENIVALDO') || cpf === '89436296134') return ['training', 'patrimonio'];
  
  if (name.includes('ANAIARA') || cpf === '04589046199' || name.includes('RAFAEL DOS SANTOS') || cpf === '86238270586') {
    return ['scheduling', 'psychosocial', 'training'];
  }
  
  if (name.includes('ANGELA MARIA TRAMARIN') || cpf === '57004641104' || name.includes('ZENIR RODRIGUES') || cpf === '46572740153') {
    return ['busca_ativa', 'scheduling', 'training'];
  }

  const isCleaningTeam = ['93070497187', '53788249153', '04908771170', '07794468108', '03560590140'].includes(cpf);
  if (isCleaningTeam) return ['scheduling', 'limpeza', 'training'];

  if (name.includes('ADENES BATISTA BARBOSA') || cpf === '43915324841') return ['scheduling', 'educarte', 'training'];

  // Base modules
  let allowed = [];
  if (isAdmin) {
    allowed = [...ALL_MODULES];
  } else {
    allowed = DEFAULT_PERMISSIONS[jobFunction] ? [...DEFAULT_PERMISSIONS[jobFunction]] : [];
  }

  // Additions and removals for edge cases
  if (name.includes('DANUBIA') || name.includes('DANÚBIA')) {
    return ['scheduling', 'training', 'gamification', 'mediacao', 'teacher'];
  }

  const isVeraLucia = name.includes('VERA LUCIA ARQUINO') || name.includes('VERA LÚCIA ARQUINO');
  if (isVeraLucia) {
    if (!allowed.includes('library')) allowed.push('library');
    if (!allowed.includes('scheduling')) allowed.push('scheduling');
    allowed = allowed.filter(m => !['almoxarifado', 'limpeza', 'infraestrutura'].includes(m));
  }

  const isCelioOrLucileia = name.includes('CELIO RICARDO') || name.includes('LUCILEIA');
  if (isCelioOrLucileia && !allowed.includes('secretariat')) {
    allowed.push('secretariat');
  }

  if (name.includes('ELIEZER')) {
    return ['civico_militar', 'scheduling', 'training'];
  }

  const isCivicoTeam = name.includes('RAUL') || name.includes('JOÃO VITOR') || name.includes('JOAO VITOR') || name.includes('MARCELO');
  if (isCivicoTeam) {
    if (!allowed.includes('civico_militar')) allowed.push('civico_militar');
    if (!allowed.includes('scheduling')) allowed.push('scheduling');
    if (!allowed.includes('training')) allowed.push('training');
  }

  return allowed;
}

const moduleNames = {
  'secretariat': 'Secretaria',
  'merenda': 'Merenda Escolar',
  'finance': 'Financeiro',
  'busca_ativa': 'Busca Ativa',
  'mediacao': 'Mediação Escolar',
  'psychosocial': 'Equipe Psicossocial',
  'pedagogical': 'Gestão',
  'teacher': 'Área do Professor',
  'scheduling': 'Agendas',
  'library': 'Biblioteca',
  'almoxarifado': 'Almoxarifado',
  'limpeza': 'Limpeza & Higienização',
  'infraestrutura': 'Manutenção Predial',
  'patrimonio': 'Patrimônio',
  'special_education': 'Sala de Recursos e APA',
  'civico_militar': 'Cívico-Militar',
  'educarte': 'Projeto Educarte',
  'training': 'Formação & Cursos',
  'gamification': 'Gamificação das Turmas',
  'settings': 'Configurações'
};

async function generateReport() {
  const { data: staff, error } = await supabase.from('staff').select('*').eq('status', 'EM_ATIVIDADE').order('name');
  if (error) {
    console.error('Error fetching staff:', error);
    return;
  }

  let markdown = '# Relação de Servidores e Acessos no Portal\n\n';
  markdown += 'Este relatório mostra todos os servidores em atividade e a quais módulos do sistema eles têm acesso, considerando suas funções e as exceções personalizadas.\n\n';
  
  markdown += '| Servidor | CPF | Função RH | Módulos de Acesso |\n';
  markdown += '|---|---|---|---|\n';

  for (const s of staff) {
    const modules = getModulesForUser(s);
    const moduleTitles = modules.map(m => moduleNames[m] || m).sort().join(', ');
    
    // Formatar CPF
    let formattedCpf = s.cpf || s.login || '-';
    if (formattedCpf.length === 11) {
      formattedCpf = formattedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    markdown += `| **${s.name}** | ${formattedCpf} | ${s.job_function || s.role} | ${moduleTitles} |\n`;
  }

  const outPath = 'C:\\\\Users\\\\User\\\\.gemini\\\\antigravity\\\\brain\\\\4e393436-e6d8-4f4d-a28e-e2cf652f4dce\\\\relatorio_acessos.md';
  fs.writeFileSync(outPath, markdown, 'utf8');
  console.log('Report generated at:', outPath);
}

generateReport();
