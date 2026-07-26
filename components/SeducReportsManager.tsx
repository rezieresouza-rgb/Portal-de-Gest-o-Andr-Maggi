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
  UserCheck
} from 'lucide-react';
import { User } from '../types';

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

// Initial Data for Doc 1: Cronograma de Inspeções
const INITIAL_DOC1_ITEMS = [
  { id: '1', system: 'Estrutura & Alvenaria', frequency: 'Quadrimestral', months: ['Janeiro', 'Maio', 'Setembro'], responsible: 'Genivaldo / Equipe Predial' },
  { id: '2', system: 'Cobertura & Telhado', frequency: 'Semestral', months: ['Fevereiro', 'Agosto'], responsible: 'Equipe de Manutenção' },
  { id: '3', system: 'Instalações Elétricas & Iluminação', frequency: 'Trimestral', months: ['Janeiro', 'Abril', 'Julho', 'Outubro'], responsible: 'Eletricista Credenciado' },
  { id: '4', system: 'Instalações Hidráulicas & Esgoto', frequency: 'Trimestral', months: ['Fevereiro', 'Maio', 'Agosto', 'Novembro'], responsible: 'Encanador / Apoio' },
  { id: '5', system: 'Climatização & Ar Condicionado', frequency: 'Mensal', months: ['Mensalmente'], responsible: 'Técnico HVAC' },
  { id: '6', system: 'Pintura & Revestimentos', frequency: 'Semestral', months: ['Janeiro', 'Julho'], responsible: 'Zeladoria Predial' },
  { id: '7', system: 'Sanitários & Bebedouros', frequency: 'Mensal', months: ['Mensalmente'], responsible: 'AAE Limpeza / Manutenção' },
  { id: '8', system: 'Segurança & Equipamentos Incêndio', frequency: 'Semestral', months: ['Março', 'Setembro'], responsible: 'Bombeiro Civil / Gestão' }
];

// Initial Data for Doc 2: Ficha de Inspeções
const INITIAL_DOC2_ITEMS = [
  { id: '1', system: 'Esgotamento Sanitário e Caixas de Gordura', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Limpeza e desobstrução efetuadas recentemente.' },
  { id: '2', system: 'Instalações de Reservatório e Caixas d\'Água', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Higienização e lavagem completadas no início do ano.' },
  { id: '3', system: 'Instalações de Gás (Cozinha)', status: 'ADEQUADO', risk: 'MÉDIO', obs: 'Central de gás revisada com teste de estanqueidade OK.' },
  { id: '4', system: 'Ar Condicionado (Salas e Bloco Adm)', status: 'NÃO_ADEQUADO', risk: 'MÉDIO', obs: 'Unidades das salas 04 e 06 necessitam de higienização profunda.' },
  { id: '5', system: 'Quadro Geral de Distribuição Elétrica (QGD)', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Disjuntores e barramentos identificados e organizados.' },
  { id: '6', system: 'Iluminação Externa e Refletores da Quadra', status: 'NÃO_ADEQUADO', risk: 'BAIXO', obs: 'Substituição pendente de 4 refletores LED queimados.' },
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
  { id: '3', system: 'Troca de Lampadas da Secretaria', initialStatus: 'NÃO ADEQUADO', action: 'Instalação de lâmpadas tubulares LED', status: 'CONCLUÍDO', date: '25/01/2026' },
  { id: '4', system: 'Refletores da Quadra', initialStatus: 'NÃO ADEQUADO', action: 'Substituição de refletores queimados', status: 'PENDENTE', date: '25/07/2026' }
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
  schoolReality: 'A unidade possui excelente estrutura física com laboratórios, salas climatizadas e auditório. Registra-se necessidade contínua de orientação quanto ao uso zelosodo mobiliário e conservação de banheiros e paredes.',
  planning: '1. Apresentação do Manual de Manutenção Predial 2025 para a equipe.\n2. Formação da Brigada Mirim do Zelo Escolar com líderes de turma.\n3. Campanhas periódicas de uso consciente da água, energia e preservação das carteiras.',
  execution: 'Ações iniciadas em Março/2026 com palestra motivacional no auditório e gincana da sala mais limpa e conservada.',
  photos: [] as string[]
};

export const SeducReportsManager: React.FC<SeducReportsManagerProps> = ({ initialDoc = 'doc1', user }) => {
  const [activeDoc, setActiveDoc] = useState<SeducDocType>(initialDoc);
  const [schoolInfo, setSchoolInfo] = useState(DEFAULT_SCHOOL_INFO);

  // States for each report
  const [doc1Items, setDoc1Items] = useState(INITIAL_DOC1_ITEMS);
  const [doc2Items, setDoc2Items] = useState(INITIAL_DOC2_ITEMS);
  const [doc3Items, setDoc3Items] = useState(INITIAL_DOC3_ITEMS);
  const [doc4Items, setDoc4Items] = useState(INITIAL_DOC4_ITEMS);
  const [doc5Items, setDoc5Items] = useState(INITIAL_DOC5_ITEMS);
  const [doc6Items, setDoc6Items] = useState(INITIAL_DOC6_ITEMS);
  const [doc7Data, setDoc7Data] = useState(INITIAL_DOC7_DATA);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedSchool = localStorage.getItem('seduc_school_info_v1');
      if (savedSchool) setSchoolInfo(JSON.parse(savedSchool));

      const savedDoc1 = localStorage.getItem('seduc_doc1_v1');
      if (savedDoc1) setDoc1Items(JSON.parse(savedDoc1));

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

  // Save changes
  const saveAll = () => {
    try {
      localStorage.setItem('seduc_school_info_v1', JSON.stringify(schoolInfo));
      localStorage.setItem('seduc_doc1_v1', JSON.stringify(doc1Items));
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

  // Document Title Mapping
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

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Top Header & Navigation for Documents */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm no-print space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest">
              <Building2 size={16} />
              <span>Modelos Oficiais SEDUC-MT 2025/2026</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mt-1">
              Gestão de Relatórios de Manutenção Predial
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={saveAll}
              className="px-5 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-md"
            >
              <Save size={16} />
              <span>Salvar Dados</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg"
            >
              <Printer size={18} />
              <span>Imprimir Relatório Oficial</span>
            </button>
          </div>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {[
            { id: 'doc1', label: '1. Cronograma' },
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
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeDoc === tab.id
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRINTABLE REPORT CONTAINER */}
      <div id="seduc-printable-report" className="bg-white p-8 md:p-12 rounded-[2rem] border border-gray-200 shadow-md printable-seduc-doc w-full min-w-0">
        
        {/* OFFICIAL SEDUC HEADER */}
        <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
          <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-700">Governo do Estado de Mato Grosso</p>
          <p className="text-sm md:text-base font-black uppercase tracking-wider text-gray-900 mt-0.5">SECRETARIA DE ESTADO DE EDUCAÇÃO</p>
          <h1 className="text-lg md:text-2xl font-black uppercase text-amber-700 tracking-tight mt-3">
            {getDocTitle(activeDoc)}
          </h1>
        </div>

        {/* IDENTIFICATION BOX */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">
            Identificação da Unidade Escolar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold uppercase text-gray-800">
            <div>
              <span className="text-[10px] text-gray-400 block font-black">Escola:</span>
              <input
                value={schoolInfo.name}
                onChange={e => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                className="w-full bg-transparent font-black text-gray-900 border-b border-dashed border-gray-300 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-black">Código Inep/SEDUC:</span>
              <input
                value={schoolInfo.code}
                onChange={e => setSchoolInfo({ ...schoolInfo, code: e.target.value })}
                className="w-full bg-transparent font-black text-gray-900 border-b border-dashed border-gray-300 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-black">Município:</span>
              <input
                value={schoolInfo.city}
                onChange={e => setSchoolInfo({ ...schoolInfo, city: e.target.value })}
                className="w-full bg-transparent font-black text-gray-900 border-b border-dashed border-gray-300 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-black">DRE:</span>
              <input
                value={schoolInfo.dre}
                onChange={e => setSchoolInfo({ ...schoolInfo, dre: e.target.value })}
                className="w-full bg-transparent font-black text-gray-900 border-b border-dashed border-gray-300 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold uppercase text-gray-800 pt-2 border-t border-gray-200/60">
            <div>
              <span className="text-[10px] text-gray-400 block font-black">Diretor(a):</span>
              <input
                value={schoolInfo.director}
                onChange={e => setSchoolInfo({ ...schoolInfo, director: e.target.value })}
                className="w-full bg-transparent font-black text-gray-900 border-b border-dashed border-gray-300 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-black">Coordenadores(as):</span>
              <input
                value={schoolInfo.coordinators}
                onChange={e => setSchoolInfo({ ...schoolInfo, coordinators: e.target.value })}
                className="w-full bg-transparent font-black text-gray-900 border-b border-dashed border-gray-300 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-black">Secretário(a):</span>
              <input
                value={schoolInfo.secretary}
                onChange={e => setSchoolInfo({ ...schoolInfo, secretary: e.target.value })}
                className="w-full bg-transparent font-black text-gray-900 border-b border-dashed border-gray-300 outline-none"
              />
            </div>
          </div>
        </div>

        {/* DOCUMENT CONTENT SWITCH */}

        {/* DOC 1: CRONOGRAMA DE INSPEÇÕES */}
        {activeDoc === 'doc1' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
              <h3 className="text-sm font-black uppercase text-gray-700">Sistemas e Frequência de Vistoria</h3>
              <button
                onClick={() => setDoc1Items([...doc1Items, { id: Date.now().toString(), system: 'Novo Sistema', frequency: 'Mensal', months: ['Mensalmente'], responsible: 'Equipe' }])}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-100"
              >
                <Plus size={14} /> Adicionar Sistema
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-left text-xs font-sans">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 uppercase font-black">
                    <th className="border border-gray-300 p-3">Sistema / Instalação</th>
                    <th className="border border-gray-300 p-3">Frequência Prevista</th>
                    <th className="border border-gray-300 p-3">Meses de Execução</th>
                    <th className="border border-gray-300 p-3">Responsável</th>
                    <th className="border border-gray-300 p-2 text-center no-print">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {doc1Items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-bold text-gray-900">
                        <input
                          value={item.system}
                          onChange={e => {
                            const updated = [...doc1Items];
                            updated[idx].system = e.target.value;
                            setDoc1Items(updated);
                          }}
                          className="w-full bg-transparent outline-none font-bold"
                        />
                      </td>
                      <td className="border border-gray-300 p-3">
                        <input
                          value={item.frequency}
                          onChange={e => {
                            const updated = [...doc1Items];
                            updated[idx].frequency = e.target.value;
                            setDoc1Items(updated);
                          }}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                      <td className="border border-gray-300 p-3">
                        <input
                          value={item.months.join(', ')}
                          onChange={e => {
                            const updated = [...doc1Items];
                            updated[idx].months = e.target.value.split(',').map(m => m.trim());
                            setDoc1Items(updated);
                          }}
                          className="w-full bg-transparent outline-none font-semibold text-amber-800"
                        />
                      </td>
                      <td className="border border-gray-300 p-3">
                        <input
                          value={item.responsible}
                          onChange={e => {
                            const updated = [...doc1Items];
                            updated[idx].responsible = e.target.value;
                            setDoc1Items(updated);
                          }}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center no-print">
                        <button
                          onClick={() => setDoc1Items(doc1Items.filter(i => i.id !== item.id))}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DOC 2: FICHA DE INSPEÇÕES */}
        {activeDoc === 'doc2' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
              <h3 className="text-sm font-black uppercase text-gray-700">Verificação dos Itens Físicos</h3>
              <button
                onClick={() => setDoc2Items([...doc2Items, { id: Date.now().toString(), system: 'Novo Elemento', status: 'ADEQUADO', risk: 'BAIXO', obs: 'Sem observações' }])}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-100"
              >
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Itens Adequados</p>
                <p className="text-2xl font-black">{doc2Items.filter(i => i.status === 'ADEQUADO').length}</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Itens Não Adequados</p>
                <p className="text-2xl font-black">{doc2Items.filter(i => i.status === 'NÃO_ADEQUADO').length}</p>
              </div>
              <div className="p-4 bg-gray-100 border border-gray-300 rounded-2xl text-gray-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total de Itens Auditados</p>
                <p className="text-2xl font-black">{doc2Items.length}</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-gray-300 text-left text-xs font-sans">
              <thead>
                <tr className="bg-gray-100 text-gray-900 uppercase font-black">
                  <th className="border border-gray-300 p-3">Elemento / Instalação</th>
                  <th className="border border-gray-300 p-3 text-center">Condição</th>
                  <th className="border border-gray-300 p-3 text-center">Risco</th>
                  <th className="border border-gray-300 p-3">Observação Técnica</th>
                  <th className="border border-gray-300 p-2 text-center no-print">Ação</th>
                </tr>
              </thead>
              <tbody>
                {doc2Items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-bold text-gray-900">
                      <input
                        value={item.system}
                        onChange={e => {
                          const updated = [...doc2Items];
                          updated[idx].system = e.target.value;
                          setDoc2Items(updated);
                        }}
                        className="w-full bg-transparent outline-none font-bold"
                      />
                    </td>
                    <td className="border border-gray-300 p-3 text-center font-black">
                      <select
                        value={item.status}
                        onChange={e => {
                          const updated = [...doc2Items];
                          updated[idx].status = e.target.value;
                          setDoc2Items(updated);
                        }}
                        className={`bg-transparent outline-none font-black ${
                          item.status === 'ADEQUADO' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        <option value="ADEQUADO">ADEQUADO</option>
                        <option value="NÃO_ADEQUADO">NÃO ADEQUADO</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-3 text-center">
                      <select
                        value={item.risk}
                        onChange={e => {
                          const updated = [...doc2Items];
                          updated[idx].risk = e.target.value;
                          setDoc2Items(updated);
                        }}
                        className="bg-transparent outline-none font-black"
                      >
                        <option value="BAIXO">BAIXO</option>
                        <option value="MÉDIO">MÉDIO</option>
                        <option value="ALTO">ALTO</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-3">
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
                    <td className="border border-gray-300 p-2 text-center no-print">
                      <button
                        onClick={() => setDoc2Items(doc2Items.filter(i => i.id !== item.id))}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOC 3: RELATÓRIO DE DEMANDA */}
        {activeDoc === 'doc3' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
              <h3 className="text-sm font-black uppercase text-gray-700">Necessidades de Intervenção Priorizadas</h3>
              <button
                onClick={() => setDoc3Items([...doc3Items, { id: Date.now().toString(), system: 'Nova Demanda', diagnosis: 'Diagnóstico da necessidade', risk: 'MÉDIO', priority: 'MÉDIA', costEst: 'R$ 0,00' }])}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-100"
              >
                <Plus size={14} /> Adicionar Demanda
              </button>
            </div>

            <table className="w-full border-collapse border border-gray-300 text-left text-xs font-sans">
              <thead>
                <tr className="bg-gray-100 text-gray-900 uppercase font-black">
                  <th className="border border-gray-300 p-3">Item / Local</th>
                  <th className="border border-gray-300 p-3">Diagnóstico da Necessidade</th>
                  <th className="border border-gray-300 p-3 text-center">Risco</th>
                  <th className="border border-gray-300 p-3 text-center">Prioridade</th>
                  <th className="border border-gray-300 p-3">Custo Estimado</th>
                  <th className="border border-gray-300 p-2 text-center no-print">Ação</th>
                </tr>
              </thead>
              <tbody>
                {doc3Items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-bold text-gray-900">
                      <input
                        value={item.system}
                        onChange={e => {
                          const updated = [...doc3Items];
                          updated[idx].system = e.target.value;
                          setDoc3Items(updated);
                        }}
                        className="w-full bg-transparent outline-none font-bold"
                      />
                    </td>
                    <td className="border border-gray-300 p-3">
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
                    <td className="border border-gray-300 p-3 text-center font-black">
                      <select
                        value={item.risk}
                        onChange={e => {
                          const updated = [...doc3Items];
                          updated[idx].risk = e.target.value;
                          setDoc3Items(updated);
                        }}
                        className="bg-transparent outline-none font-black"
                      >
                        <option value="BAIXO">BAIXO</option>
                        <option value="MÉDIO">MÉDIO</option>
                        <option value="ALTO">ALTO</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-3 text-center font-black">
                      <select
                        value={item.priority}
                        onChange={e => {
                          const updated = [...doc3Items];
                          updated[idx].priority = e.target.value;
                          setDoc3Items(updated);
                        }}
                        className="bg-transparent outline-none font-black text-amber-700"
                      >
                        <option value="BAIXA">BAIXA</option>
                        <option value="MÉDIA">MÉDIA</option>
                        <option value="ALTA">ALTA</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-3 font-bold">
                      <input
                        value={item.costEst}
                        onChange={e => {
                          const updated = [...doc3Items];
                          updated[idx].costEst = e.target.value;
                          setDoc3Items(updated);
                        }}
                        className="w-full bg-transparent outline-none font-bold"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 text-center no-print">
                      <button
                        onClick={() => setDoc3Items(doc3Items.filter(i => i.id !== item.id))}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOC 4: CHECKLIST DE INTERVENÇÕES */}
        {activeDoc === 'doc4' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center no-print">
              <h3 className="text-sm font-black uppercase text-gray-700">Intervenções Efetuadas e Registros Fotográficos</h3>
              <button
                onClick={() => setDoc4Items([...doc4Items, { id: Date.now().toString(), system: 'Nova Intervenção', risk: 'BAIXO', diagnosis: 'Descrição', description: 'Serviço efetuado', serviceValue: 'R$ 0,00', materialValue: 'R$ 0,00', executor: 'Empresa', nfs: 'NF-001', photoBefore: '', photoAfter: '' }])}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-100"
              >
                <Plus size={14} /> Adicionar Intervenção
              </button>
            </div>

            {doc4Items.map((item, idx) => (
              <div key={item.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-300 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <h4 className="text-sm font-black uppercase text-amber-800">Intervenção #{idx + 1}</h4>
                  <button
                    onClick={() => setDoc4Items(doc4Items.filter(i => i.id !== item.id))}
                    className="text-xs text-red-600 font-bold hover:underline no-print"
                  >
                    Excluir
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Item / Sistema:</label>
                    <input
                      value={item.system}
                      onChange={e => {
                        const updated = [...doc4Items];
                        updated[idx].system = e.target.value;
                        setDoc4Items(updated);
                      }}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Executor / Nota Fiscal:</label>
                    <input
                      value={`${item.executor} | ${item.nfs}`}
                      onChange={e => {
                        const updated = [...doc4Items];
                        const parts = e.target.value.split('|');
                        updated[idx].executor = parts[0] ? parts[0].trim() : '';
                        updated[idx].nfs = parts[1] ? parts[1].trim() : '';
                        setDoc4Items(updated);
                      }}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-200 font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Descrição da Manutenção Realizada:</label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={e => {
                        const updated = [...doc4Items];
                        updated[idx].description = e.target.value;
                        setDoc4Items(updated);
                      }}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-200 font-semibold"
                    />
                  </div>
                </div>

                {/* PHOTOS ANTES E DEPOIS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="border border-gray-300 p-4 rounded-2xl bg-white text-center space-y-2">
                    <p className="text-xs font-black uppercase text-gray-700">Foto 1 – Antes da Intervenção</p>
                    {item.photoBefore ? (
                      <div className="relative group">
                        <img src={item.photoBefore} alt="Antes" className="w-full h-44 object-cover rounded-xl border" />
                        <button
                          onClick={() => {
                            const updated = [...doc4Items];
                            updated[idx].photoBefore = '';
                            setDoc4Items(updated);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all no-print"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 no-print">
                        <ImageIcon className="text-gray-400 mb-1" size={24} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Carregar Foto Antes</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleFileUpload(e, url => {
                            const updated = [...doc4Items];
                            updated[idx].photoBefore = url;
                            setDoc4Items(updated);
                          })}
                        />
                      </label>
                    )}
                  </div>

                  <div className="border border-gray-300 p-4 rounded-2xl bg-white text-center space-y-2">
                    <p className="text-xs font-black uppercase text-gray-700">Foto 2 – Após a Intervenção</p>
                    {item.photoAfter ? (
                      <div className="relative group">
                        <img src={item.photoAfter} alt="Depois" className="w-full h-44 object-cover rounded-xl border" />
                        <button
                          onClick={() => {
                            const updated = [...doc4Items];
                            updated[idx].photoAfter = '';
                            setDoc4Items(updated);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all no-print"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 no-print">
                        <ImageIcon className="text-gray-400 mb-1" size={24} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Carregar Foto Depois</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleFileUpload(e, url => {
                            const updated = [...doc4Items];
                            updated[idx].photoAfter = url;
                            setDoc4Items(updated);
                          })}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DOC 5: RELATÓRIO DE VERIFICAÇÃO */}
        {activeDoc === 'doc5' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
              <h3 className="text-sm font-black uppercase text-gray-700">Atesto de Conformidade das Manutenções</h3>
              <button
                onClick={() => setDoc5Items([...doc5Items, { id: Date.now().toString(), system: 'Novo Item', initialStatus: 'NÃO ADEQUADO', action: 'Ação executada', status: 'CONCLUÍDO', date: '2026-07-25' }])}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-100"
              >
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            <table className="w-full border-collapse border border-gray-300 text-left text-xs font-sans">
              <thead>
                <tr className="bg-gray-100 text-gray-900 uppercase font-black">
                  <th className="border border-gray-300 p-3">Item / Sistema</th>
                  <th className="border border-gray-300 p-3">Manutenção Planejada / Ação</th>
                  <th className="border border-gray-300 p-3 text-center">Status Final</th>
                  <th className="border border-gray-300 p-3 text-center">Data Atesto</th>
                  <th className="border border-gray-300 p-2 text-center no-print">Ação</th>
                </tr>
              </thead>
              <tbody>
                {doc5Items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-bold text-gray-900">
                      <input
                        value={item.system}
                        onChange={e => {
                          const updated = [...doc5Items];
                          updated[idx].system = e.target.value;
                          setDoc5Items(updated);
                        }}
                        className="w-full bg-transparent outline-none font-bold"
                      />
                    </td>
                    <td className="border border-gray-300 p-3">
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
                    <td className="border border-gray-300 p-3 text-center font-black">
                      <select
                        value={item.status}
                        onChange={e => {
                          const updated = [...doc5Items];
                          updated[idx].status = e.target.value;
                          setDoc5Items(updated);
                        }}
                        className={`bg-transparent outline-none font-black ${
                          item.status === 'CONCLUÍDO' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        <option value="CONCLUÍDO">CONCLUÍDO</option>
                        <option value="PENDENTE">PENDENTE</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-3 text-center font-bold">
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
                    <td className="border border-gray-300 p-2 text-center no-print">
                      <button
                        onClick={() => setDoc5Items(doc5Items.filter(i => i.id !== item.id))}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOC 6: JUSTIFICATIVA DE PENDÊNCIAS */}
        {activeDoc === 'doc6' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center no-print">
              <h3 className="text-sm font-black uppercase text-gray-700">Registro Transparente de Pendências</h3>
              <button
                onClick={() => setDoc6Items([...doc6Items, { id: Date.now().toString(), system: 'Item Pendente', risk: 'BAIXO', observedCondition: 'Condição', neededMaintenance: 'Reparo necessário', justification: 'Justificativa...', photo1: '', photo2: '' }])}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-100"
              >
                <Plus size={14} /> Adicionar Pendência
              </button>
            </div>

            {doc6Items.map((item, idx) => (
              <div key={item.id} className="p-6 bg-red-50/40 rounded-2xl border border-red-200 space-y-4">
                <div className="flex justify-between items-center border-b border-red-200 pb-3">
                  <h4 className="text-sm font-black uppercase text-red-800">Pendência #{idx + 1}</h4>
                  <button
                    onClick={() => setDoc6Items(doc6Items.filter(i => i.id !== item.id))}
                    className="text-xs text-red-600 font-bold hover:underline no-print"
                  >
                    Excluir
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">Item / Sistema Pendente:</label>
                    <input
                      value={item.system}
                      onChange={e => {
                        const updated = [...doc6Items];
                        updated[idx].system = e.target.value;
                        setDoc6Items(updated);
                      }}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">Justificativa Oficial para a Não Realização:</label>
                    <textarea
                      rows={3}
                      value={item.justification}
                      onChange={e => {
                        const updated = [...doc6Items];
                        updated[idx].justification = e.target.value;
                        setDoc6Items(updated);
                      }}
                      className="w-full bg-white p-3 rounded-xl border border-gray-300 font-medium leading-relaxed"
                    />
                  </div>
                </div>

                {/* PHOTOS DO ESTADO ATUAL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="border border-gray-300 p-4 rounded-2xl bg-white text-center space-y-2">
                    <p className="text-xs font-black uppercase text-gray-700">Foto 1 – Condição Atual</p>
                    {item.photo1 ? (
                      <div className="relative group">
                        <img src={item.photo1} alt="Foto 1" className="w-full h-40 object-cover rounded-xl border" />
                        <button
                          onClick={() => {
                            const updated = [...doc6Items];
                            updated[idx].photo1 = '';
                            setDoc6Items(updated);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all no-print"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 no-print">
                        <ImageIcon className="text-gray-400 mb-1" size={24} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Carregar Foto 1</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleFileUpload(e, url => {
                            const updated = [...doc6Items];
                            updated[idx].photo1 = url;
                            setDoc6Items(updated);
                          })}
                        />
                      </label>
                    )}
                  </div>

                  <div className="border border-gray-300 p-4 rounded-2xl bg-white text-center space-y-2">
                    <p className="text-xs font-black uppercase text-gray-700">Foto 2 – Detalhe da Pendência</p>
                    {item.photo2 ? (
                      <div className="relative group">
                        <img src={item.photo2} alt="Foto 2" className="w-full h-40 object-cover rounded-xl border" />
                        <button
                          onClick={() => {
                            const updated = [...doc6Items];
                            updated[idx].photo2 = '';
                            setDoc6Items(updated);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all no-print"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 no-print">
                        <ImageIcon className="text-gray-400 mb-1" size={24} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Carregar Foto 2</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleFileUpload(e, url => {
                            const updated = [...doc6Items];
                            updated[idx].photo2 = url;
                            setDoc6Items(updated);
                          })}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DOC 7: PLANO DE BOAS PRÁTICAS */}
        {activeDoc === 'doc7' && (
          <div className="space-y-6 text-xs font-sans">
            <div className="space-y-2">
              <label className="font-black text-gray-900 uppercase">Objetivo da Ação:</label>
              <textarea
                rows={2}
                value={doc7Data.objective}
                onChange={e => setDoc7Data({ ...doc7Data, objective: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="font-black text-gray-900 uppercase">Público-Alvo:</label>
              <input
                value={doc7Data.targetAudience}
                onChange={e => setDoc7Data({ ...doc7Data, targetAudience: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="font-black text-gray-900 uppercase">Realidade Escolar & Diagnóstico:</label>
              <textarea
                rows={3}
                value={doc7Data.schoolReality}
                onChange={e => setDoc7Data({ ...doc7Data, schoolReality: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="font-black text-gray-900 uppercase">Planejamento das Ações Educativas:</label>
              <textarea
                rows={4}
                value={doc7Data.planning}
                onChange={e => setDoc7Data({ ...doc7Data, planning: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="font-black text-gray-900 uppercase">Execução & Resultados Obtidos:</label>
              <textarea
                rows={3}
                value={doc7Data.execution}
                onChange={e => setDoc7Data({ ...doc7Data, execution: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-medium"
              />
            </div>
          </div>
        )}

        {/* OFFICIAL SIGNATURE FOOTER FOR ALL DOCS */}
        <div className="mt-12 pt-8 border-t-2 border-gray-900 space-y-6">
          <p className="text-center text-xs font-bold uppercase text-gray-600">
            {schoolInfo.city}, ____ de _____________________ de {schoolInfo.year}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs font-bold uppercase pt-4">
            <div className="space-y-1">
              <p className="border-b border-gray-900 w-3/4 mx-auto pb-1">{schoolInfo.director}</p>
              <p className="text-[10px] text-gray-500 font-black">Diretor(a) Escolar</p>
            </div>
            <div className="space-y-1">
              <p className="border-b border-gray-900 w-3/4 mx-auto pb-1">{schoolInfo.coordinators}</p>
              <p className="text-[10px] text-gray-500 font-black">Coordenação Pedagógica / Gestão</p>
            </div>
          </div>
        </div>

      </div>

      {/* PRINT CSS STYLING */}
      <style>{`
        @media print {
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
            margin: 0;
            padding: 20px;
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
