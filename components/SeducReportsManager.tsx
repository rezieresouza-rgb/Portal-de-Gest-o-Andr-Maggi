import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileText,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  ChevronRight,
  Info,
  Building2,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabaseClient';

export type SeducDocType = 'doc1' | 'doc2' | 'doc3' | 'doc4' | 'doc5' | 'doc6' | 'doc7';

interface SeducReportsManagerProps {
  initialDoc?: SeducDocType;
  user?: User;
}

// School Info Defaults
const DEFAULT_SCHOOL_INFO = {
  name: 'ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
  code: '51190826',
  city: 'COLÍDER',
  dre: 'DRE SINOP',
  director: 'MARIA DA SILVA',
  coordinators: 'JOÃO SANTOS, PAULA SOUZA',
  secretary: 'ANA OLIVEIRA',
  year: '2026'
};

// 29 OFFICIAL ITEMS OF SEDUC-MT DOC 1 (CRONOGRAMA DE INSPEÇÕES)
const OFFICIAL_29_ITEMS = [
  { num: 1, item: 'SISTEMA CONSTRUTIVO (IDENTIFICAÇÃO DE PATOLOGIAS)', periodicity: 'Verificar 1 vez ao ano.', months: [false, fontMonth(1), false, false, false, false, false, false, false, false, false, false] },
  { num: 2, item: 'COBERTURA', periodicity: '2 vezes ao ano, priorizando períodos que antecedam as épocas chuvosas.', months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 3, item: 'FORRO (OPCIONAL)', periodicity: '2 vezes ao ano, priorizando períodos de férias escolares.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 4, item: 'PISOS E REVESTIMENTOS', periodicity: '1 vez ao ano, priorizando períodos de férias escolares.', months: [fontMonth(0), false, false, false, false, false, false, false, false, false, false, false] },
  { num: 5, item: 'PINTURA', periodicity: '● Áreas internas: a cada 3 anos.\n● Áreas externas: a cada 2 anos.\n(fazer inspeção em 2026)', months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 6, item: 'ESQUADRIAS', periodicity: 'Pintura a cada 2 ou 3 anos (fazer inspeção em 2026).', months: [fontMonth(0), false, false, false, false, false, false, false, false, false, false, false] },
  { num: 7, item: 'INSTALAÇÕES ELÉTRICAS BAIXA TENSÃO', periodicity: '● Inspeção geral, testes de segurança e teste de aterramento: 1 vez ao ano.\n● Limpeza de quadros e equipamentos: 3 vezes ao ano.', months: [fontMonth(0), false, false, fontMonth(3), false, false, fontMonth(6), false, false, fontMonth(9), false, false] },
  { num: 8, item: 'INSTALAÇÕES HIDROSSANITÁRIAS CAIXA D’ÁGUA E CISTERNA (RESERVATÓRIOS)', periodicity: 'Caixas d\'água e cisternas devem ser limpas 1 vez por ano.', months: [fontMonth(0), false, false, false, false, false, false, false, false, false, false, false] },
  { num: 9, item: 'INSTALAÇÕES HIDROSSANITÁRIAS RALOS E SIFÕES', periodicity: 'Inspeção e limpeza ao menos 1 vez ao mês ou sempre que notar mau funcionamento.', months: [true, true, true, true, true, true, true, true, true, true, true, true] },
  { num: 10, item: 'INSTALAÇÕES HIDROSSANITÁRIAS VÁLVULAS E REGISTROS', periodicity: 'Inspeção ao menos 1 vez ao mês e a substituição sempre que verificado mau funcionamento.', months: [true, true, true, true, true, true, true, true, true, true, true, true] },
  { num: 11, item: 'INSTALAÇÕES HIDROSSANITÁRIAS SISTEMA DE TRATAMENTO DE ESGOTO (STE)', periodicity: 'Inspeção e limpeza ao menos 2 vezes no ano ou sempre que necessário.', months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 12, item: 'INSTALAÇÕES HIDROSSANITÁRIAS CAIXA DE GORDURA', periodicity: 'Realizar limpeza sempre que necessário, especialmente se houver sinais de mau funcionamento.', months: [fontMonth(0), false, fontMonth(2), false, fontMonth(4), false, fontMonth(6), false, fontMonth(8), false, fontMonth(10), false] },
  { num: 13, item: 'INSTALAÇÕES HIDROSSANITÁRIAS INSTALAÇÕES DE GÁS (OPCIONAL)', periodicity: 'Inspeção mensal ou sempre que necessário.', isOptional: true, months: [true, true, true, true, true, true, true, true, true, true, true, true] },
  { num: 14, item: 'INSTALAÇÕES DE COMBATE A INCÊNDIO EXTINTORES', periodicity: 'Verificação a cada 5 anos ou conforme recomendação do fabricante.', months: [fontMonth(0), false, false, false, false, false, false, false, false, false, false, false] },
  { num: 15, item: 'INSTALAÇÕES DE COMBATE A INCÊNDIO HIDRANTES E MANGUEIRAS (OPCIONAL)', periodicity: 'O teste de funcionamento do sistema deve ser realizado ao menos 1 vez por ano.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, false, false, false, false, false, false] },
  { num: 16, item: 'INSTALAÇÕES DE COMBATE A INCÊNDIO SINALIZAÇÃO DE EMERGÊNCIA E ROTAS DE FUGA (OPCIONAL)', periodicity: 'Inspeção visual e teste de desempenho ao menos 2 vezes por ano.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 17, item: 'INSTALAÇÕES DE COMBATE A INCÊNDIO ACIONAMENTOS (OPCIONAL)', periodicity: 'Verificação detalhada e manutenção preventiva ao menos 1 vez ao ano.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, false, false, false, false, false, false] },
  { num: 18, item: 'ÁREAS MOLHADAS (LOUÇAS, METAIS, BANCADAS E DIVISÓRIAS)', periodicity: 'A verificação deve ser realizada 1 vez ao ano e a troca das peças danificadas sempre que necessário.', months: [fontMonth(0), false, false, false, false, false, false, false, false, false, false, false] },
  { num: 19, item: 'PINTURA DE DEMARCAÇÃO – QUADRA POLIESPORTIVA (OPCIONAL)', periodicity: 'Geral: 2 vezes ao ano. Pintura: inspeção visual 1 vez ao ano.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 20, item: 'PISCINA E CASA DE MÁQUINAS (OPCIONAL)', periodicity: 'Verificar a frequência de uso da piscina e, caso seja diária, realizar a limpeza toda semana.', isOptional: true, months: [false, false, false, false, false, false, false, false, false, false, false, false] },
  { num: 21, item: 'IMPLANTAÇÃO PÓRTICO (OPCIONAL)', periodicity: 'A inspeção deve ser realizada 1 vez ao ano.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, false, false, false, false, false, false] },
  { num: 22, item: 'IMPLANTAÇÃO MURO E GRADIL', periodicity: 'A inspeção deve ser realizada 2 vezes ao ano.', months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 23, item: 'IMPLANTAÇÃO DEPÓSITO DE RESÍDUOS SÓLIDOS (OPCIONAL)', periodicity: 'A inspeção deve ser realizada 2 vezes ao ano.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 24, item: 'IMPLANTAÇÃO CALÇAMENTOS', periodicity: 'A inspeção em toda escola deve ser realizada 2 vezes ao ano.', months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 25, item: 'IMPLANTAÇÃO PAISAGISMO (OPCIONAL)', periodicity: 'A manutenção deve ser feita ao menos 1 vez por mês durante o período de seca.', isOptional: true, months: [false, false, false, false, fontMonth(4), fontMonth(5), fontMonth(6), fontMonth(7), fontMonth(8), false, false, false] },
  { num: 26, item: 'IMPLANTAÇÃO SISTEMA DE DRENAGEM (OPCIONAL)', periodicity: 'A inspeção deve ser realizada 2 vezes no ano, especialmente antes do período chuvoso.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 27, item: 'ACESSIBILIDADE ESCADA E RAMPA (OPCIONAL)', periodicity: 'A inspeção deve ser realizada 2 vezes ao ano.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 28, item: 'ACESSIBILIDADE CORRIMÃO, GUARDA-CORPO E BARRAS DE APOIO (OPCIONAL)', periodicity: 'A inspeção deve ser realizada 2 vezes ao ano.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] },
  { num: 29, item: 'ACESSIBILIDADE PLACA DE SINALIZAÇÃO, MAPA E PISO TÁTIL (OPCIONAL)', periodicity: 'A inspeção deve ser realizada 2 vezes ao ano.', isOptional: true, months: [fontMonth(0), false, false, false, false, false, fontMonth(6), false, false, false, false, false] }
];

function fontMonth(m: number) {
  return true;
}

// Initial Data for Doc 2: Ficha de Inspeções
const INITIAL_DOC2_ITEMS = [
  { id: '1', system: 'Esgotamento Sanitário e Caixas de Gordura', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Limpeza e desobstrução efetuadas recentemente.' },
  { id: '2', system: 'Instalações de Reservatório e Caixas d\'Água', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Higienização e lavagem completadas no início do ano.' },
  { id: '3', system: 'Instalações de Gás (Cozinha)', status: 'ADEQUADO', risk: 'MÉDIO', obs: 'Central de gás revisada com teste de estanqueidade OK.' },
  { id: '4', system: 'Ar Condicionado (Salas e Bloco Adm)', status: 'NÃO ADEQUADO', risk: 'MÉDIO', obs: 'Unidades das salas 04 e 06 necessitam de higienização profunda.' },
  { id: '5', system: 'Quadro Geral de Distribuição Elétrica (QGD)', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Disjuntores e barramentos identificados e organizados.' },
  { id: '6', system: 'Iluminação Externa e Refletores da Quadra', status: 'NÃO ADEQUADO', risk: 'BAIXO', obs: 'Substituição pendente de 4 refletores LED queimados.' },
  { id: '7', system: 'Telhado, Calhas e Condutores Pluviais', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Revisão de telhas e desobstrução de calhas realizada.' },
  { id: '8', system: 'Pintura de Paredes e Fachada', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Pintura conservada em padrão oficial.' }
];

// Initial Data for Doc 3: Relatório de Demanda
const INITIAL_DOC3_ITEMS = [
  { id: '1', system: 'Ar Condicionado - Salas 04 e 06', diagnosis: 'Falta de rendimento e acúmulo de poeira nos evaporadores.', risk: 'MÉDIO', priority: 'ALTA', costEst: 'R$ 1.800,00' },
  { id: '2', system: 'Iluminação Externa - Refletores', diagnosis: 'Refletores de LED da quadra queimados por surto de tensão.', risk: 'BAIXO', priority: 'MÉDIA', costEst: 'R$ 1.200,00' },
  { id: '3', system: 'Fechaduras e Portas das Salas de Recursos', diagnosis: 'Desgastadas pelo uso contínuo, com emperramento.', risk: 'BAIXO', priority: 'MÉDIA', costEst: 'R$ 650,00' }
];

// Initial Data for Doc 4: Checklist de Intervenções
const INITIAL_DOC4_ITEMS = [
  {
    id: '1',
    system: 'Climatização - Higienização Profunda dos Ares-Condicionados',
    risk: 'MÉDIO',
    diagnosis: 'Acúmulo de poeira e redução da eficiência térmica nas salas 04 e 06.',
    description: 'Manutenção corretiva e preventiva com higienização química profunda dos aparelhos.',
    serviceValue: 'R$ 1.800,00',
    materialValue: 'R$ 400,00',
    executor: 'ClimaFrio Serviços LTDA',
    nfs: 'NF-e 2026-084',
    photoBefore: '',
    photoAfter: ''
  }
];

// Initial Data for Doc 5: Relatório de Verificação
const INITIAL_DOC5_ITEMS = [
  { id: '1', system: 'Limpeza de Caixas d\'Água', initialStatus: 'NÃO ADEQUADO', action: 'Higienização e cloração completa', status: 'CONCLUÍDO', date: '15/01/2026' },
  { id: '2', system: 'Revisão do QGD e Disjuntores', initialStatus: 'NÃO ADEQUADO', action: 'Reaperto e rebalanceamento de fases', status: 'CONCLUÍDO', date: '20/01/2026' },
  { id: '3', system: 'Troca de Lâmpadas da Secretaria', initialStatus: 'NÃO ADEQUADO', action: 'Instalação de lâmpadas tubulares LED', status: 'CONCLUÍDO', date: '25/01/2026' },
  { id: '4', system: 'Refletores da Quadra Poliesportiva', initialStatus: 'NÃO ADEQUADO', action: 'Substituição de refletores queimados', status: 'PENDENTE', date: '25/07/2026' }
];

// Initial Data for Doc 6: Justificativa de Pendências
const INITIAL_DOC6_ITEMS = [
  {
    id: '1',
    system: 'Refletores de LED da Quadra Poliesportiva',
    risk: 'BAIXO',
    observedCondition: '4 refletores queimados após forte tempestade elétrica.',
    neededMaintenance: 'Aquisição e troca dos refletores por modelos blindados de 200W.',
    justification: 'O recurso orçamentário do período foi prioritariamente direcionado para o conserto emergencial do telhado do bloco administrativo e higienização das caixas d\'água, garantindo a salubridade das aulas. A troca dos refletores está programada para a próxima parcela orçamentária.',
    photo1: '',
    photo2: ''
  }
];

// Initial Data for Doc 7: Plano de Boas Práticas
const INITIAL_DOC7_DATA = {
  objective: 'Promover a conscientização, engajamento e responsabilidade compartilhada entre estudantes, servidores e comunidade para a preservação e conservação do patrimônio físico escolar.',
  targetAudience: 'Estudantes dos Anos Finais, Professores, Auxiliares de Serviços Gerais (AAE) e Comunidade Escolar.',
  schoolReality: 'A unidade possui excelente estrutura física com laboratórios, salas climatizadas e auditório. Registra-se necessidade contínua de orientação quanto ao uso zeloso do mobiliário e conservação de banheiros e paredes.',
  planning: '1. Apresentação do Manual de Manutenção Predial 2025 para a equipe.\n2. Formação da Brigada Mirim do Zelo Escolar com líderes de turma.\n3. Campanhas periódicas de uso consciente da água, energia e preservação das carteiras.',
  execution: 'Ações iniciadas em Março/2026 com palestra motivacional no auditório e gincana da sala mais limpa e conservada.',
  photos: [] as string[]
};

export const SeducReportsManager: React.FC<SeducReportsManagerProps> = ({ initialDoc = 'doc1', user }) => {
  const [activeDoc, setActiveDoc] = useState<SeducDocType>(initialDoc);
  const [schoolInfo, setSchoolInfo] = useState(DEFAULT_SCHOOL_INFO);

  // States for Document 1 (29 Items)
  const [doc1Grid, setDoc1Grid] = useState(OFFICIAL_29_ITEMS);
  const [optionalMissing, setOptionalMissing] = useState<string[]>([
    'PISCINA E CASA DE MÁQUIS (Item 20)',
    'INSTALAÇÕES DE COMBATE A INCÊNDIO HIDRANTES (Item 15)'
  ]);

  // States for other docs
  const [doc2Items, setDoc2Items] = useState(INITIAL_DOC2_ITEMS);
  const [doc3Items, setDoc3Items] = useState(INITIAL_DOC3_ITEMS);
  const [doc4Items, setDoc4Items] = useState(INITIAL_DOC4_ITEMS);
  const [doc5Items, setDoc5Items] = useState(INITIAL_DOC5_ITEMS);
  const [doc6Items, setDoc6Items] = useState(INITIAL_DOC6_ITEMS);
  const [doc7Data, setDoc7Data] = useState(INITIAL_DOC7_DATA);

  // Load saved state
  useEffect(() => {
    try {
      const savedSchool = localStorage.getItem('seduc_school_info_v1');
      if (savedSchool) setSchoolInfo(JSON.parse(savedSchool));

      const savedDoc1Grid = localStorage.getItem('seduc_doc1_grid_v2');
      if (savedDoc1Grid) setDoc1Grid(JSON.parse(savedDoc1Grid));

      const savedMissing = localStorage.getItem('seduc_doc1_missing_v1');
      if (savedMissing) setOptionalMissing(JSON.parse(savedMissing));

      const savedDoc2 = localStorage.getItem('seduc_doc2_v1');
      if (savedDoc2) setDoc2Items(JSON.parse(savedDoc2));

      const savedDoc3 = localStorage.getItem('seduc_doc3_v1');
      if (savedDoc3) setDoc3Items(JSON.parse(savedDoc3));

      const savedDoc4 = localStorage.getItem('seduc_doc4_v1');
      if (savedDoc4) setDoc4Items(JSON.parse(savedDoc4));

      const savedDoc5 = localStorage.getItem('seduc_doc5_v1');
      if (savedDoc5) setDoc5Items(JSON.parse(savedDoc5));

      const savedDoc6 = localStorage.getItem('seduc_doc6_v1');
      if (savedDoc6) setDoc6Items(JSON.parse(savedDoc6));

      const savedDoc7 = localStorage.getItem('seduc_doc7_v1');
      if (savedDoc7) setDoc7Data(JSON.parse(savedDoc7));
    } catch (e) {
      console.error('Erro ao carregar dados dos relatórios SEDUC:', e);
    }
  }, []);

  const toggleDoc1Month = (itemIdx: number, monthIdx: number) => {
    const updated = [...doc1Grid];
    updated[itemIdx].months[monthIdx] = !updated[itemIdx].months[monthIdx];
    setDoc1Grid(updated);
  };

  const saveAll = () => {
    try {
      localStorage.setItem('seduc_school_info_v1', JSON.stringify(schoolInfo));
      localStorage.setItem('seduc_doc1_grid_v2', JSON.stringify(doc1Grid));
      localStorage.setItem('seduc_doc1_missing_v1', JSON.stringify(optionalMissing));
      localStorage.setItem('seduc_doc2_v1', JSON.stringify(doc2Items));
      localStorage.setItem('seduc_doc3_v1', JSON.stringify(doc3Items));
      localStorage.setItem('seduc_doc4_v1', JSON.stringify(doc4Items));
      localStorage.setItem('seduc_doc5_v1', JSON.stringify(doc5Items));
      localStorage.setItem('seduc_doc6_v1', JSON.stringify(doc6Items));
      localStorage.setItem('seduc_doc7_v1', JSON.stringify(doc7Data));
      alert('Relatório salvo com sucesso!');
    } catch (e) {
      console.error('Erro ao salvar relatórios:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getDocTitle = (type: SeducDocType) => {
    switch (type) {
      case 'doc1': return '1 – CRONOGRAMA DE INSPEÇÕES';
      case 'doc2': return '2 – FICHA DE INSPEÇÕES';
      case 'doc3': return '3 – RELATÓRIO DE DEMANDA';
      case 'doc4': return '4 – CHECKLIST DE INTERVENÇÕES';
      case 'doc5': return '5 – RELATÓRIO DE VERIFICAÇÃO';
      case 'doc6': return '6 – JUSTIFICATIVA DE PENDÊNCIAS';
      case 'doc7': return '7 – PLANO DE BOAS PRÁTICAS';
    }
  };

  // Calculations for Doc 1
  const countB = optionalMissing.filter(m => m.trim().length > 0).length;
  const countA = 29 - countB;

  return (
    <div className="w-full min-w-0 space-y-6 font-sans">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm no-print space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest">
              <Building2 size={16} />
              <span>Modelo Idêntico SEDUC-MT 2025/2026 (29 Itens Oficiais)</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mt-1">
              Gerenciador & Impressão do Cronograma de Inspeções
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={saveAll}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-black transition-all flex items-center gap-2 shadow-md"
            >
              <Save size={16} />
              <span>Salvar Dados</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-black text-xs uppercase hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg"
            >
              <Printer size={18} />
              <span>Imprimir PDF Identico (A4)</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {[
            { id: 'doc1', label: '1. Cronograma (29 Itens SEDUC)' },
            { id: 'doc2', label: '2. Ficha de Inspeções' },
            { id: 'doc3', label: '3. Demanda' },
            { id: 'doc4', label: '4. Intervenções' },
            { id: 'doc5', label: '5. Verificação' },
            { id: 'doc6', label: '6. Pendências' },
            { id: 'doc7', label: '7. Boas Práticas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveDoc(tab.id as SeducDocType)}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeDoc === tab.id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRINTABLE DOCUMENT - EXACT SEDUC-MT FORMATTING */}
      <div
        id="seduc-printable-report"
        className="bg-white p-6 sm:p-10 border border-black shadow-xl mx-auto text-black font-sans text-xs leading-tight max-w-[210mm] w-full min-w-0"
        style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
      >
        {/* HEADER GOVERNO DO ESTADO DE MATO GROSSO / SEDUC */}
        <div className="text-center font-bold uppercase tracking-normal mb-4 leading-tight">
          <p className="text-xs text-black">Governo do Estado de Mato Grosso</p>
          <p className="text-sm font-black text-black">SECRETARIA DE ESTADO DE EDUCAÇÃO</p>
          <div className="w-full border-b border-black my-2"></div>
          <h2 className="text-base font-black text-black tracking-tight mt-1">
            {getDocTitle(activeDoc)}
          </h2>
        </div>

        {/* IDENTIFICAÇÃO E EQUIPE GESTORA - TABELA PADRÃO SEDUC */}
        <div className="border border-black mb-4 text-[11px]">
          <div className="bg-gray-200 font-black p-1 border-b border-black uppercase text-center text-[10px]">
            Identificação
          </div>
          <div className="grid grid-cols-2 border-b border-black">
            <div className="p-1.5 border-r border-black font-bold">
              Nome da escola: <input value={schoolInfo.name} onChange={e => setSchoolInfo({ ...schoolInfo, name: e.target.value })} className="w-full bg-transparent font-normal outline-none uppercase" />
            </div>
            <div className="p-1.5 font-bold">
              Código da escola: <input value={schoolInfo.code} onChange={e => setSchoolInfo({ ...schoolInfo, code: e.target.value })} className="w-full bg-transparent font-normal outline-none uppercase" />
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-black">
            <div className="p-1.5 border-r border-black font-bold">
              Município: <input value={schoolInfo.city} onChange={e => setSchoolInfo({ ...schoolInfo, city: e.target.value })} className="w-full bg-transparent font-normal outline-none uppercase" />
            </div>
            <div className="p-1.5 font-bold">
              DRE: <input value={schoolInfo.dre} onChange={e => setSchoolInfo({ ...schoolInfo, dre: e.target.value })} className="w-full bg-transparent font-normal outline-none uppercase" />
            </div>
          </div>

          <div className="bg-gray-200 font-black p-1 border-b border-black uppercase text-center text-[10px]">
            Equipe Gestora
          </div>
          <div className="p-1.5 border-b border-black font-bold">
            Diretor(a): <input value={schoolInfo.director} onChange={e => setSchoolInfo({ ...schoolInfo, director: e.target.value })} className="w-full bg-transparent font-normal outline-none uppercase" />
          </div>
          <div className="p-1.5 border-b border-black font-bold">
            Coordenadores(as): <input value={schoolInfo.coordinators} onChange={e => setSchoolInfo({ ...schoolInfo, coordinators: e.target.value })} className="w-full bg-transparent font-normal outline-none uppercase" />
          </div>
          <div className="p-1.5 font-bold">
            Secretário(a): <input value={schoolInfo.secretary} onChange={e => setSchoolInfo({ ...schoolInfo, secretary: e.target.value })} className="w-full bg-transparent font-normal outline-none uppercase" />
          </div>
        </div>

        {/* DOC 1: CRONOGRAMA DE INSPEÇÕES (EXACT 29 SEDUC ITEMS + MONTH MATRIX) */}
        {activeDoc === 'doc1' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-gray-700 italic border-b border-black pb-1 mb-2">
              Marcar com um “x” o mês correspondente para a realização de inspeção, de acordo com a periodicidade.
            </p>

            <table className="w-full border-collapse border border-black text-left text-[10px]">
              <thead>
                <tr className="bg-gray-200 text-black uppercase font-black text-center">
                  <th className="border border-black p-1 w-7">N°</th>
                  <th className="border border-black p-1 text-left">ITEM</th>
                  <th className="border border-black p-1 w-44 text-left">PERIODICIDADE</th>
                  {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map(m => (
                    <th key={m} className="border border-black p-1 w-6 text-center">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc1Grid.map((row, idx) => (
                  <tr key={row.num} className="hover:bg-gray-50">
                    <td className="border border-black p-1 text-center font-bold">{row.num}</td>
                    <td className="border border-black p-1 font-bold leading-tight">
                      {row.item}
                    </td>
                    <td className="border border-black p-1 text-[9px] leading-tight whitespace-pre-line">
                      {row.periodicity}
                    </td>
                    {row.months.map((checked, mIdx) => (
                      <td
                        key={mIdx}
                        onClick={() => toggleDoc1Month(idx, mIdx)}
                        className="border border-black p-0 text-center font-black text-xs cursor-pointer select-none hover:bg-amber-100"
                        title="Clique para marcar / desmarcar 'x'"
                      >
                        {checked ? 'X' : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TABELA DE ITENS OPCIONAIS QUE NÃO POSSUI */}
            <div className="pt-4 space-y-2">
              <p className="font-bold text-[10px]">
                Algumas unidades escolares não possuem determinados itens. Identifiquem aqui quais <strong>ITENS OPCIONAIS</strong> a unidade escolar não possui:
              </p>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-200 text-black font-black uppercase">
                    <th className="border border-black p-1 w-10 text-center">Num</th>
                    <th className="border border-black p-1">Item Opcional Não Possuído</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="border border-black p-1 text-center font-bold">{i + 1}</td>
                      <td className="border border-black p-1 font-semibold">
                        <input
                          value={optionalMissing[i] || ''}
                          onChange={e => {
                            const updated = [...optionalMissing];
                            updated[i] = e.target.value;
                            setOptionalMissing(updated);
                          }}
                          placeholder="Ex: PISCINA E CASA DE MÁQUINAS (Item 20)"
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RESUMO TOTAL DE ITENS (A + B = 29) */}
            <div className="border border-black p-2 bg-gray-100 space-y-1 text-[11px] font-bold">
              <p className="font-black uppercase border-b border-black pb-1 mb-1">Especifiquem as quantidades a seguir:</p>
              <div className="flex justify-between">
                <span>A – Quantidade de itens que possui:</span>
                <span className="font-black">{countA}</span>
              </div>
              <div className="flex justify-between">
                <span>B – Quantidade de itens opcionais que não possui:</span>
                <span className="font-black">{countB}</span>
              </div>
              <div className="flex justify-between border-t border-black pt-1 font-black text-amber-900">
                <span>Quantidade total de itens (A + B):</span>
                <span>29</span>
              </div>
            </div>
          </div>
        )}

        {/* DOC 2: FICHA DE INSPEÇÕES */}
        {activeDoc === 'doc2' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center no-print">
              <span className="font-bold uppercase text-[11px]">Tabela Geral de Vistorias e Contagem</span>
              <button
                onClick={() => setDoc2Items([...doc2Items, { id: Date.now().toString(), system: 'Novo Item', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Sem observações' }])}
                className="px-2 py-1 bg-gray-200 text-black text-[10px] font-bold rounded flex items-center gap-1 border border-black"
              >
                + Adicionar Item
              </button>
            </div>

            <div className="border border-black p-3 bg-gray-100 text-xs font-bold space-y-1 mb-3">
              <p className="font-black uppercase">Contagem dos Itens:</p>
              <p>Itens em condições adequadas: <strong>{doc2Items.filter(i => i.status === 'ADEQUADO').length}</strong></p>
              <p>Itens em condições não adequadas: <strong>{doc2Items.filter(i => i.status === 'NÃO ADEQUADO').length}</strong></p>
              <p>Total de Itens Auditados: <strong>{doc2Items.length}</strong></p>
            </div>

            <table className="w-full border-collapse border border-black text-left text-xs">
              <thead>
                <tr className="bg-gray-200 text-black uppercase font-black">
                  <th className="border border-black p-2">Item / Sistema</th>
                  <th className="border border-black p-2 text-center">Condição</th>
                  <th className="border border-black p-2 text-center">Grau de Risco</th>
                  <th className="border border-black p-2">Observações Técnicas</th>
                  <th className="border border-black p-1 text-center no-print">Excluir</th>
                </tr>
              </thead>
              <tbody>
                {doc2Items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-black p-2 font-bold">
                      <input
                        value={item.system}
                        onChange={e => {
                          const updated = [...doc2Items];
                          updated[idx].system = e.target.value;
                          setDoc2Items(updated);
                        }}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      <select
                        value={item.status}
                        onChange={e => {
                          const updated = [...doc2Items];
                          updated[idx].status = e.target.value;
                          setDoc2Items(updated);
                        }}
                        className="bg-transparent outline-none font-bold"
                      >
                        <option value="ADEQUADO">ADEQUADO</option>
                        <option value="NÃO ADEQUADO">NÃO ADEQUADO</option>
                      </select>
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      <select
                        value={item.risk}
                        onChange={e => {
                          const updated = [...doc2Items];
                          updated[idx].risk = e.target.value;
                          setDoc2Items(updated);
                        }}
                        className="bg-transparent outline-none font-bold"
                      >
                        <option value="BAIXO">BAIXO</option>
                        <option value="MÉDIO">MÉDIO</option>
                        <option value="ALTO">ALTO</option>
                      </select>
                    </td>
                    <td className="border border-black p-2">
                      <input
                        value={item.obs}
                        onChange={e => {
                          const updated = [...doc2Items];
                          updated[idx].obs = e.target.value;
                          setDoc2Items(updated);
                        }}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border border-black p-1 text-center no-print">
                      <button onClick={() => setDoc2Items(doc2Items.filter(i => i.id !== item.id))} className="text-red-600 font-bold">X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOC 3: RELATÓRIO DE DEMANDA */}
        {activeDoc === 'doc3' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center no-print">
              <span className="font-bold uppercase text-[11px]">Demandas Priorizadas</span>
              <button
                onClick={() => setDoc3Items([...doc3Items, { id: Date.now().toString(), system: 'Nova Demanda', diagnosis: 'Diagnóstico', risk: 'MÉDIO', priority: 'MÉDIA', costEst: 'R$ 0,00' }])}
                className="px-2 py-1 bg-gray-200 text-black text-[10px] font-bold rounded flex items-center gap-1 border border-black"
              >
                + Adicionar Demanda
              </button>
            </div>

            <table className="w-full border-collapse border border-black text-left text-xs">
              <thead>
                <tr className="bg-gray-200 text-black uppercase font-black">
                  <th className="border border-black p-2">Item / Local</th>
                  <th className="border border-black p-2">Diagnóstico da Necessidade</th>
                  <th className="border border-black p-2 text-center">Risco</th>
                  <th className="border border-black p-2 text-center">Prioridade</th>
                  <th className="border border-black p-2 text-center">Custo Estimado</th>
                  <th className="border border-black p-1 text-center no-print">Excluir</th>
                </tr>
              </thead>
              <tbody>
                {doc3Items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-black p-2 font-bold">
                      <input
                        value={item.system}
                        onChange={e => {
                          const updated = [...doc3Items];
                          updated[idx].system = e.target.value;
                          setDoc3Items(updated);
                        }}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border border-black p-2">
                      <textarea
                        rows={2}
                        value={item.diagnosis}
                        onChange={e => {
                          const updated = [...doc3Items];
                          updated[idx].diagnosis = e.target.value;
                          setDoc3Items(updated);
                        }}
                        className="w-full bg-transparent outline-none resize-none"
                      />
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      <select
                        value={item.risk}
                        onChange={e => {
                          const updated = [...doc3Items];
                          updated[idx].risk = e.target.value;
                          setDoc3Items(updated);
                        }}
                        className="bg-transparent outline-none font-bold"
                      >
                        <option value="BAIXO">BAIXO</option>
                        <option value="MÉDIO">MÉDIO</option>
                        <option value="ALTO">ALTO</option>
                      </select>
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      <select
                        value={item.priority}
                        onChange={e => {
                          const updated = [...doc3Items];
                          updated[idx].priority = e.target.value;
                          setDoc3Items(updated);
                        }}
                        className="bg-transparent outline-none font-bold"
                      >
                        <option value="BAIXA">BAIXA</option>
                        <option value="MÉDIA">MÉDIA</option>
                        <option value="ALTA">ALTA</option>
                      </select>
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      <input
                        value={item.costEst}
                        onChange={e => {
                          const updated = [...doc3Items];
                          updated[idx].costEst = e.target.value;
                          setDoc3Items(updated);
                        }}
                        className="w-full bg-transparent outline-none text-center font-bold"
                      />
                    </td>
                    <td className="border border-black p-1 text-center no-print">
                      <button onClick={() => setDoc3Items(doc3Items.filter(i => i.id !== item.id))} className="text-red-600 font-bold">X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOC 4: CHECKLIST DE INTERVENÇÕES */}
        {activeDoc === 'doc4' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
              <span className="font-bold uppercase text-[11px]">Intervenções e Registros Fotográficos</span>
              <button
                onClick={() => setDoc4Items([...doc4Items, { id: Date.now().toString(), system: 'Nova Intervenção', risk: 'BAIXO', diagnosis: 'Descrição', description: 'Serviço efetuado', serviceValue: 'R$ 0,00', materialValue: 'R$ 0,00', executor: 'Empresa', nfs: 'NF-001', photoBefore: '', photoAfter: '' }])}
                className="px-2 py-1 bg-gray-200 text-black text-[10px] font-bold rounded flex items-center gap-1 border border-black"
              >
                + Adicionar Intervenção
              </button>
            </div>

            {doc4Items.map((item, idx) => (
              <div key={item.id} className="border border-black p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-black pb-2 font-bold uppercase">
                  <span>ITEM / INTERVENÇÃO #{idx + 1}: {item.system}</span>
                  <button onClick={() => setDoc4Items(doc4Items.filter(i => i.id !== item.id))} className="text-red-600 text-xs no-print">Remover</button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong>Sistema / Elemento:</strong>
                    <input value={item.system} onChange={e => { const u = [...doc4Items]; u[idx].system = e.target.value; setDoc4Items(u); }} className="w-full border border-gray-400 p-1 mt-0.5 font-bold" />
                  </div>
                  <div>
                    <strong>Executor & Nota Fiscal:</strong>
                    <input value={`${item.executor} | ${item.nfs}`} onChange={e => { const u = [...doc4Items]; const p = e.target.value.split('|'); u[idx].executor = p[0]?.trim() || ''; u[idx].nfs = p[1]?.trim() || ''; setDoc4Items(u); }} className="w-full border border-gray-400 p-1 mt-0.5" />
                  </div>
                  <div className="col-span-2">
                    <strong>Manutenção Realizada:</strong>
                    <textarea rows={2} value={item.description} onChange={e => { const u = [...doc4Items]; u[idx].description = e.target.value; setDoc4Items(u); }} className="w-full border border-gray-400 p-1 mt-0.5" />
                  </div>
                </div>

                <div className="border border-black p-2 mt-2">
                  <p className="text-center font-bold uppercase text-[11px] mb-2">Registro Fotográfico</p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="border border-black p-2 bg-gray-50">
                      <p className="font-bold text-[10px] uppercase mb-1">Foto 1 – Antes da Intervenção</p>
                      {item.photoBefore ? (
                        <img src={item.photoBefore} alt="Antes" className="w-full h-40 object-cover border border-black" />
                      ) : (
                        <label className="flex flex-col items-center justify-center h-40 border border-dashed border-black cursor-pointer no-print">
                          <span className="text-[10px] font-bold">Clique para Carregar Foto</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, url => { const u = [...doc4Items]; u[idx].photoBefore = url; setDoc4Items(u); })} />
                        </label>
                      )}
                    </div>

                    <div className="border border-black p-2 bg-gray-50">
                      <p className="font-bold text-[10px] uppercase mb-1">Foto 2 – Após a Intervenção</p>
                      {item.photoAfter ? (
                        <img src={item.photoAfter} alt="Depois" className="w-full h-40 object-cover border border-black" />
                      ) : (
                        <label className="flex flex-col items-center justify-center h-40 border border-dashed border-black cursor-pointer no-print">
                          <span className="text-[10px] font-bold">Clique para Carregar Foto</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, url => { const u = [...doc4Items]; u[idx].photoAfter = url; setDoc4Items(u); })} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DOC 5: RELATÓRIO DE VERIFICAÇÃO */}
        {activeDoc === 'doc5' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center no-print">
              <span className="font-bold uppercase text-[11px]">Conformidade e Atesto Pós-Intervenção</span>
              <button
                onClick={() => setDoc5Items([...doc5Items, { id: Date.now().toString(), system: 'Novo Item', initialStatus: 'NÃO ADEQUADO', action: 'Ação executada', status: 'CONCLUÍDO', date: '2026-07-25' }])}
                className="px-2 py-1 bg-gray-200 text-black text-[10px] font-bold rounded flex items-center gap-1 border border-black"
              >
                + Adicionar Item
              </button>
            </div>

            <table className="w-full border-collapse border border-black text-left text-xs">
              <thead>
                <tr className="bg-gray-200 text-black uppercase font-black">
                  <th className="border border-black p-2">Item / Sistema</th>
                  <th className="border border-black p-2">Manutenção Planejada / Ação</th>
                  <th className="border border-black p-2 text-center">Status Final</th>
                  <th className="border border-black p-2 text-center">Data Atesto</th>
                  <th className="border border-black p-1 text-center no-print">Excluir</th>
                </tr>
              </thead>
              <tbody>
                {doc5Items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-black p-2 font-bold">
                      <input
                        value={item.system}
                        onChange={e => {
                          const updated = [...doc5Items];
                          updated[idx].system = e.target.value;
                          setDoc5Items(updated);
                        }}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border border-black p-2">
                      <input
                        value={item.action}
                        onChange={e => {
                          const updated = [...doc5Items];
                          updated[idx].action = e.target.value;
                          setDoc5Items(updated);
                        }}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      <select
                        value={item.status}
                        onChange={e => {
                          const updated = [...doc5Items];
                          updated[idx].status = e.target.value;
                          setDoc5Items(updated);
                        }}
                        className="bg-transparent outline-none font-bold"
                      >
                        <option value="CONCLUÍDO">CONCLUÍDO</option>
                        <option value="PENDENTE">PENDENTE</option>
                      </select>
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      <input
                        value={item.date}
                        onChange={e => {
                          const updated = [...doc5Items];
                          updated[idx].date = e.target.value;
                          setDoc5Items(updated);
                        }}
                        className="w-full bg-transparent outline-none text-center"
                      />
                    </td>
                    <td className="border border-black p-1 text-center no-print">
                      <button onClick={() => setDoc5Items(doc5Items.filter(i => i.id !== item.id))} className="text-red-600 font-bold">X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOC 6: JUSTIFICATIVA DE PENDÊNCIAS */}
        {activeDoc === 'doc6' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
              <span className="font-bold uppercase text-[11px]">Registro Formal de Justificativa</span>
              <button
                onClick={() => setDoc6Items([...doc6Items, { id: Date.now().toString(), system: 'Item Pendente', risk: 'BAIXO', observedCondition: 'Condição', neededMaintenance: 'Reparo necessário', justification: 'Justificativa...', photo1: '', photo2: '' }])}
                className="px-2 py-1 bg-gray-200 text-black text-[10px] font-bold rounded flex items-center gap-1 border border-black"
              >
                + Adicionar Pendência
              </button>
            </div>

            {doc6Items.map((item, idx) => (
              <div key={item.id} className="border border-black p-4 space-y-3 bg-gray-50/50">
                <div className="flex justify-between items-center border-b border-black pb-2 font-bold uppercase">
                  <span>ITEM PENDENTE #{idx + 1}: {item.system}</span>
                  <button onClick={() => setDoc6Items(doc6Items.filter(i => i.id !== item.id))} className="text-red-600 text-xs no-print">Remover</button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <strong>ITEM / SISTEMA:</strong>
                    <input value={item.system} onChange={e => { const u = [...doc6Items]; u[idx].system = e.target.value; setDoc6Items(u); }} className="w-full border border-gray-400 p-1 mt-0.5 font-bold" />
                  </div>

                  <div>
                    <strong>Justificativa para a Não Realização da Manutenção:</strong>
                    <textarea rows={3} value={item.justification} onChange={e => { const u = [...doc6Items]; u[idx].justification = e.target.value; setDoc6Items(u); }} className="w-full border border-gray-400 p-2 mt-0.5 font-medium leading-normal" />
                  </div>
                </div>

                <div className="border border-black p-2 mt-2 bg-white">
                  <p className="text-center font-bold uppercase text-[11px] mb-2">Registro Fotográfico (Condição que se encontra – antes da intervenção)</p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="border border-black p-2">
                      <p className="font-bold text-[10px] uppercase mb-1">Foto 1</p>
                      {item.photo1 ? (
                        <img src={item.photo1} alt="Foto 1" className="w-full h-36 object-cover border border-black" />
                      ) : (
                        <label className="flex flex-col items-center justify-center h-36 border border-dashed border-black cursor-pointer no-print">
                          <span className="text-[10px] font-bold">Carregar Foto 1</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, url => { const u = [...doc6Items]; u[idx].photo1 = url; setDoc6Items(u); })} />
                        </label>
                      )}
                    </div>

                    <div className="border border-black p-2">
                      <p className="font-bold text-[10px] uppercase mb-1">Foto 2</p>
                      {item.photo2 ? (
                        <img src={item.photo2} alt="Foto 2" className="w-full h-36 object-cover border border-black" />
                      ) : (
                        <label className="flex flex-col items-center justify-center h-36 border border-dashed border-black cursor-pointer no-print">
                          <span className="text-[10px] font-bold">Carregar Foto 2</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, url => { const u = [...doc6Items]; u[idx].photo2 = url; setDoc6Items(u); })} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DOC 7: PLANO DE BOAS PRÁTICAS */}
        {activeDoc === 'doc7' && (
          <div className="space-y-4 text-xs">
            <div className="border border-black p-3 space-y-1">
              <strong className="block uppercase font-black text-black">Objetivo:</strong>
              <textarea rows={2} value={doc7Data.objective} onChange={e => setDoc7Data({ ...doc7Data, objective: e.target.value })} className="w-full bg-transparent outline-none" />
            </div>

            <div className="border border-black p-3 space-y-1">
              <strong className="block uppercase font-black text-black">Público-alvo:</strong>
              <input value={doc7Data.targetAudience} onChange={e => setDoc7Data({ ...doc7Data, targetAudience: e.target.value })} className="w-full bg-transparent outline-none font-bold" />
            </div>

            <div className="border border-black p-3 space-y-1">
              <strong className="block uppercase font-black text-black">Realidade escolar:</strong>
              <textarea rows={3} value={doc7Data.schoolReality} onChange={e => setDoc7Data({ ...doc7Data, schoolReality: e.target.value })} className="w-full bg-transparent outline-none" />
            </div>

            <div className="border border-black p-3 space-y-1">
              <strong className="block uppercase font-black text-black">Planejamento:</strong>
              <textarea rows={4} value={doc7Data.planning} onChange={e => setDoc7Data({ ...doc7Data, planning: e.target.value })} className="w-full bg-transparent outline-none" />
            </div>

            <div className="border border-black p-3 space-y-1">
              <strong className="block uppercase font-black text-black">Execução:</strong>
              <textarea rows={3} value={doc7Data.execution} onChange={e => setDoc7Data({ ...doc7Data, execution: e.target.value })} className="w-full bg-transparent outline-none" />
            </div>
          </div>
        )}

        {/* RODAPÉ E ASSINATURAS IDÊNTICAS AO MODELO OFICIAL SEDUC */}
        <div className="mt-8 pt-4 border-t border-black space-y-4">
          <p className="text-center font-bold text-xs uppercase">
            {schoolInfo.city}, ____ de _____________________ de {schoolInfo.year}.
          </p>

          <p className="text-center font-black text-xs uppercase tracking-wider">
            Responsáveis pela Unidade Escolar
          </p>

          <div className="grid grid-cols-2 gap-8 text-center text-xs font-bold pt-2">
            <div className="space-y-1">
              <p className="font-bold">Nome: <u>{schoolInfo.director}</u></p>
              <div className="border-b border-black w-4/5 mx-auto mt-6"></div>
              <p className="text-[10px] uppercase font-black">Diretor(a)</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold">Nome: <u>{schoolInfo.coordinators}</u></p>
              <div className="border-b border-black w-4/5 mx-auto mt-6"></div>
              <p className="text-[10px] uppercase font-black">Coordenador(a)</p>
            </div>
          </div>
        </div>

      </div>

      {/* PRINT STYLING - EXACT PAGE FIT & A4 MARGINS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }
          body * {
            visibility: hidden;
          }
          #seduc-printable-report, #seduc-printable-report * {
            visibility: visible;
          }
          #seduc-printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100% !important;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SeducReportsManager;
