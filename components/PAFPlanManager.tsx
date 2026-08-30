import React, { useState, useMemo } from 'react';
import {
  Target,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Printer,
  ChevronRight,
  Plus,
  FileSpreadsheet,
  Building,
  Scale,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRightLeft,
  X
} from 'lucide-react';
import { Transaction } from '../types';

export interface PAFMaterialClass {
  id: string;
  name: string;
  group: 'CUSTEIO' | 'CAPITAL';
  budgetedValue: number;
  description: string;
  examples: string[];
  keywords: string[];
}

export const PAF_OFFICIAL_CLASSES_2026: PAFMaterialClass[] = [
  // ================= CUSTEIO =================
  {
    id: 'uniformes',
    name: 'Confecção de Uniformes',
    group: 'CUSTEIO',
    budgetedValue: 12000.00,
    description: 'Uniformes aos profissionais da Nutrição Escolar e Limpeza da escola.',
    examples: ['Uniformes para merendeiras', 'Camisetas e calças para equipe de limpeza', 'Aventais de tecido', 'Toucas de tecido'],
    keywords: ['uniforme', 'uniformes', 'avental', 'confeccao de uniforme']
  },
  {
    id: 'acessibilidade',
    name: 'Acessibilidade e Adequações de Espaços',
    group: 'CUSTEIO',
    budgetedValue: 13000.00,
    description: 'Construção/adequação de rampas, corrimãos, sanitários acessíveis, sinalização tátil, visual e sonora.',
    examples: ['Sinalização tátil', 'Sinalização visual para degraus', 'Tapete emborrachado', 'Talheres acessíveis', 'Soroban'],
    keywords: ['acessibilidade', 'rampa', 'corrimao', 'corrimão', 'sinalizacao tatil', 'sinalização', 'sanitario acessivel']
  },
  {
    id: 'servicos_graficos',
    name: 'Contratação de Serviços Gráficos',
    group: 'CUSTEIO',
    budgetedValue: 1000.00,
    description: 'Boletins, encartes, folders, impressão de jornais, revistas, serviços de xerografia e encadernação de livros.',
    examples: ['Xerox e impressões pedagógicas', 'Encartes e folders institucionais', 'Encadernações', 'Boletins escolares'],
    keywords: ['grafica', 'gráfica', 'graficos', 'gráficos', 'xerox', 'xerografia', 'encadernacao', 'encadernação', 'folder', 'boletim']
  },
  {
    id: 'confeccao_instalacoes',
    name: 'Serviços de Confecção e Instalações sob Medida',
    group: 'CUSTEIO',
    budgetedValue: 48000.00,
    description: 'Confecção de cortinas de tecido, mesas adaptadas, murais informativos, palcos para apresentações, prateleiras e armários sob medida para biblioteca/sala de leitura.',
    examples: ['Cortinas para salas de aula', 'Murais de aviso', 'Mesas sob medida', 'Prateleiras e estantes sob medida'],
    keywords: ['cortina', 'cortinas', 'mural', 'murais', 'sob medida', 'prateleira sob medida', 'confeccao de mesa']
  },
  {
    id: 'tarifas_consumo',
    name: 'Pagamento de Tarifas, Telefone, Internet e Tributos',
    group: 'CUSTEIO',
    budgetedValue: 39000.00,
    description: 'Pagamento de tarifa bancária, serviços de internet, comunicação de dados, tributos, taxas de cartório e tarifa telefônica.',
    examples: ['Fatura de Internet', 'Tarifas e taxas bancárias', 'Conta telefônica', 'Taxas cartorárias', 'Tributos e tarifas'],
    keywords: ['tarifa', 'bancaria', 'internet', 'comunicacao de dados', 'telefone', 'telefonia', 'cartorio', 'cartório', 'tributo']
  },
  {
    id: 'epis',
    name: 'EPIs (Equipamento de Proteção Individual)',
    group: 'CUSTEIO',
    budgetedValue: 1300.00,
    description: 'Botas de segurança, gorros/toucas de cozinha, luvas de PVC, máscaras descartáveis, óculos de proteção, protetores auriculares, avental impermeável.',
    examples: ['Toucas descartáveis', 'Luvas de PVC/látex', 'Botas antiderrapantes', 'Avental impermeável', 'Óculos de proteção'],
    keywords: ['epi', 'epis', 'bota de seguranca', 'touca', 'luva de pvc', 'mascara', 'máscara', 'protetor auricular']
  },
  {
    id: 'itens_cozinha',
    name: 'Itens e Utensílios de Cozinha (Consumo)',
    group: 'CUSTEIO',
    budgetedValue: 1700.00,
    description: 'Baldes, canecas de merenda, chaleiras, talheres, conchas industriais, copos, escorredor, frigideiras, gás de cozinha, leiteiras, panelas de pressão <20L, panos de prato, tábuas plásticas.',
    examples: ['Recargas de botijão de gás', 'Panos de prato', 'Copos e pratos para merenda', 'Conchas e colheres industriais', 'Panela de pressão'],
    keywords: ['gas de cozinha', 'gás de cozinha', 'pano de prato', 'caneca', 'copo descartavel', 'talheres', 'concha', 'frigideira', 'coador', 'escorredor']
  },
  {
    id: 'itens_laboratorio',
    name: 'Itens para Laboratórios (Ciências, Química, Física, Matemática)',
    group: 'CUSTEIO',
    budgetedValue: 1800.00,
    description: 'Apostilas metodológicas, geoplanos, jogos algébricos e trigonométricos, kits de geometria, lâminas e lâminulas, reagentes químicos, sólidos geométricos, tubos de ensaio.',
    examples: ['Reagentes químicos', 'Lâminas para microscópio', 'Jogos de frações e álgebra', 'Sólidos geométricos em acrílico'],
    keywords: ['laboratorio', 'laboratório', 'reagente', 'geoplano', 'solidos geometricos', 'tubo de ensaio', 'ciencias', 'quimica', 'fisica']
  },
  {
    id: 'limpeza_higiene',
    name: 'Itens de Limpeza e Higiene',
    group: 'CUSTEIO',
    budgetedValue: 59000.00,
    description: 'Água sanitária, desinfetantes, detergentes, sabão em pó, sacos de lixo, vassouras, rodos, papel higiênico, papel toalha, sabonete líquido, limpa-pedra, limpa-vidros.',
    examples: ['Detergente e desinfetante', 'Papel toalha e higiênico', 'Sacos para lixo 100L', 'Sabonete líquido para banheiros', 'Vassouras e rodos'],
    keywords: ['limpeza', 'higiene', 'detergente', 'desinfetante', 'sabao', 'sabão', 'papel higienico', 'papel toalha', 'saco de lixo', 'vassoura', 'rodo', 'agua sanitaria']
  },
  {
    id: 'itens_esportivos',
    name: 'Itens e Materiais Esportivos',
    group: 'CUSTEIO',
    budgetedValue: 4000.00,
    description: 'Apitos, bambolês, bolas esportivas (futsal, vôlei, basquete), colchonetes, cones de PVC, cordas, esteiras, infladores manuais, coletes esportivos, jogos de xadrez, redes.',
    examples: ['Bolas de futsal e vôlei', 'Coletes de treino', 'Colchonetes de ginástica', 'Redes de trave/vôlei', 'Cones de treinamento'],
    keywords: ['esporte', 'esportes', 'esportivo', 'bola', 'bolas', 'futsal', 'volei', 'vôlei', 'colete', 'colchonete', 'cone', 'xadrez', 'rede']
  },
  {
    id: 'pedagogicos_aee',
    name: 'Materiais Pedagógicos, Tecnologia Assistiva e AEE',
    group: 'CUSTEIO',
    budgetedValue: 1800.00,
    description: 'Alfabetos em Braille e Libras, dominós adaptados, calculadoras sonoras, materiais táteis, facilitadores de punho, esquemas corporais e jogos para inclusão.',
    examples: ['Alfabeto em Braille e Libras', 'Jogos táteis adaptados', 'Facilitadores de escrita', 'Calculadoras sonoras'],
    keywords: ['aee', 'tecnologia assistiva', 'braille', 'libras', 'tátil', 'tatil', 'inclusao', 'inclusão']
  },
  {
    id: 'material_expediente',
    name: 'Material de Expediente e Secretaria',
    group: 'CUSTEIO',
    budgetedValue: 7000.00,
    description: 'Papel A4, grampeadores, canetas, pastas, caixas de arquivo morto, envelopes, livros de ata, carimbos, clipes, corretivos, fita adesiva, toners e cartuchos de impressora.',
    examples: ['Resmas de Papel A4', 'Toners e tintas para impressora', 'Pastas suspensas e caixas arquivo', 'Livros de ata e envelopes'],
    keywords: ['expediente', 'papel a4', 'resma', 'grampeador', 'pasta', 'envelope', 'livro de ata', 'carimbo', 'secretaria']
  },
  {
    id: 'material_pedagogico',
    name: 'Material Pedagógico e Didático',
    group: 'CUSTEIO',
    budgetedValue: 25000.00,
    description: 'EVA, cartolinas, massas de modelar, tintas guache, colas, lápis de cor, giz escolar, cadernos, pincéis para quadro branco, TNT, fitas e tecidos para projetos.',
    examples: ['Placas de EVA e cartolinas', 'Pincéis e tintas para quadro branco', 'Massa de modelar e colas', 'Tintas guache e pincéis'],
    keywords: ['pedagogico', 'pedagógico', 'eva', 'cartolina', 'tinta guache', 'cola', 'lapis de cor', 'pincel quadro branco', 'tnt']
  },
  {
    id: 'pecas_reposicao',
    name: 'Peças de Reposição e Manutenção de Equipamentos',
    group: 'CUSTEIO',
    budgetedValue: 7000.00,
    description: 'Compressores de ar-condicionado, peças de reposição para bebedouros, máquinas copiadoras, ventiladores e instrumentos musicais.',
    examples: ['Compressor de ar-condicionado', 'Gás refrigerante R410/R22', 'Peças para bebedouro escolar', 'Cabos e conectores de reposição'],
    keywords: ['peca de reposicao', 'peça de reposição', 'compressor', 'gas r410', 'gas r22', 'pecas ar condicionado', 'motor']
  },
  {
    id: 'manutencao_imoveis',
    name: 'Material para Manutenção de Bens Imóveis (Predial)',
    group: 'CUSTEIO',
    budgetedValue: 8000.00,
    description: 'Cimento, areia, cal, tintas para parede, cerâmicas, tubos e conexões hidráulicas, fiação elétrica, disjuntores, fechaduras, lâmpadas, portas e telhas.',
    examples: ['Tintas látex e esmalte', 'Lâmpadas LED e disjuntores', 'Cimento, areia e cerâmica', 'Torneiras e canos de PVC', 'Fechaduras'],
    keywords: ['manutencao de bens imoveis', 'predial', 'cimento', 'areia', 'cal', 'tinta parede', 'ceramica', 'fio', 'lampada', 'telha', 'torneira', 'cano']
  },
  {
    id: 'processamento_dados',
    name: 'Processamento de Dados e Suprimentos de TI',
    group: 'CUSTEIO',
    budgetedValue: 4500.00,
    description: 'Placas, cabos USB/rede, mouses, teclados, pendrives, recargas de toners, cartuchos de tinta para impressoras da escola.',
    examples: ['Mouses e teclados', 'Cabos de rede e patch cords', 'Pendrives', 'Cartuchos de tinta e toners'],
    keywords: ['processamento de dados', 'cabo usb', 'mouse', 'teclado', 'pendrive', 'toner impressora', 'cartucho tinta']
  },
  {
    id: 'servicos_manutencao',
    name: 'Serviços de Manutenção, Climatização, Pintura e Jardinagem',
    group: 'CUSTEIO',
    budgetedValue: 125900.00,
    description: 'Manutenção preventiva e corretiva de ar-condicionado, higienização de bebedouros, serviços de pintura predial, reparos em telhados/calçadas, jardinagem e dedetização.',
    examples: ['Manutenção e limpeza de ar-condicionado', 'Pintura geral das salas e muros', 'Serviços de pedreiro e elétrica', 'Dedetização e limpeza de caixas d\'água'],
    keywords: ['manutencao ar condicionado', 'manutenção ar condicionado', 'limpeza de ar condicionado', 'climatizacao', 'climatização', 'pintura', 'jardinagem', 'dedetizacao', 'servicos de terceiros', 'servico pedreiro', 'servico eletrico']
  },
  {
    id: 'emenda_parlamentar',
    name: 'Emenda Parlamentar (Aditivo ao PAF - Custeio)',
    group: 'CUSTEIO',
    budgetedValue: 100000.00,
    description: 'Recurso extraordinário proveniente de Emenda Parlamentar estadual creditado em 11/08/2026 para fortalecimento das ações de infraestrutura e pedagógicas da unidade escolar.',
    examples: ['Aquisições vinculadas à emenda parlamentar', 'Reformas e reparos especiais', 'Projetos pedagógicos extraordinários'],
    keywords: ['emenda', 'emenda parlamentar', 'recurso de emenda']
  },
  {
    id: 'saldo_anterior_custeio',
    name: 'Saldo Reprogramado Exercício Anterior (Custeio)',
    group: 'CUSTEIO',
    budgetedValue: 6909.01,
    description: 'Saldo remanescente de Custeio do exercício 2025 reprogramado para execução no PAF 2026.',
    examples: ['Saldo financeiro de 2025 em conta de custeio'],
    keywords: ['saldo reprogramado', 'saldo exercicio anterior', 'exercicio anterior']
  },

  // ================= CAPITAL =================
  {
    id: 'capital_ti',
    name: 'Equipamentos de TI e Processamento de Dados (CAPITAL)',
    group: 'CAPITAL',
    budgetedValue: 10000.00,
    description: 'Notebooks, computadores desktop, nobreaks, roteadores corporativos, scanners, telas retráteis para projetor.',
    examples: ['Notebooks para secretaria/coordenação', 'Nobreaks de alta capacidade', 'Roteadores e Access Points', 'Projetores'],
    keywords: ['notebook', 'computador', 'desktop', 'nobreak', 'roteador', 'scanner', 'projetor', 'tela projetor']
  },
  {
    id: 'capital_cozinha',
    name: 'Equipamentos de Cozinha e Eletrodomésticos (CAPITAL)',
    group: 'CAPITAL',
    budgetedValue: 27000.00,
    description: 'Fogão industrial de 4/6 bocas, refrigeradores/freezers industriais, fornos micro-ondas, exaustores industriais, liquidificadores industriais, caldeirões, aspiradores industriais.',
    examples: ['Fogão industrial', 'Freezer horizontal para merenda', 'Liquidificador industrial 8L/10L', 'Forno micro-ondas', 'Exaustor industrial'],
    keywords: ['fogao industrial', 'fogão industrial', 'freezer', 'geladeira', 'liquidificador industrial', 'micro-ondas', 'exaustor', 'aspirador de po']
  },
  {
    id: 'capital_mobiliario',
    name: 'Mobiliários em Geral e Ativo Permanente (CAPITAL)',
    group: 'CAPITAL',
    budgetedValue: 3000.00,
    description: 'Armários de aço, arquivos de aço, balcões de atendimento, carteiras e bancos escolares, escrivaninhas, estantes de aço, quadros brancos vitrificados.',
    examples: ['Armários de aço 2 portas', 'Arquivos para pastas suspensas', 'Mesas e escrivaninhas', 'Estantes de aço reforçadas', 'Quadro branco'],
    keywords: ['armario de aco', 'armário de aço', 'arquivo de aco', 'cadeira fixa', 'carteira escolar', 'escrivaninha', 'estante de aco', 'quadro branco']
  },
  {
    id: 'saldo_anterior_capital',
    name: 'Saldo Reprogramado Exercício Anterior (Capital)',
    group: 'CAPITAL',
    budgetedValue: 3327.41,
    description: 'Saldo remanescente de Capital do exercício 2025 reprogramado para aquisições permanentes no PAF 2026.',
    examples: ['Saldo financeiro de 2025 em conta de capital permanente'],
    keywords: ['saldo reprogramado capital', 'saldo exercicio anterior capital']
  }
];

interface PAFPlanManagerProps {
  ruTransactions: Transaction[];
  onOpenNewExpenseWithClass?: (materialClass: PAFMaterialClass) => void;
}

export const PAFPlanManager: React.FC<PAFPlanManagerProps> = ({
  ruTransactions = [],
  onOpenNewExpenseWithClass
}) => {
  const [selectedGroup, setSelectedGroup] = useState<'ALL' | 'CUSTEIO' | 'CAPITAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailModalClass, setDetailModalClass] = useState<PAFMaterialClass | null>(null);

  // Calcula gastos reais vinculados a cada classe de material
  const classesWithStats = useMemo(() => {
    const expenseTxs = ruTransactions.filter(t => t.type === 'EXPENSE');

    return PAF_OFFICIAL_CLASSES_2026.map(pafClass => {
      // Encontra transações que pertencem a esta classe
      const matchingTxs = expenseTxs.filter(tx => {
        // 1. Grupo deve bater
        if (pafClass.group === 'CAPITAL' && tx.group !== 'CAPITAL') return false;
        if (pafClass.group === 'CUSTEIO' && tx.group === 'CAPITAL') return false;

        const cat = (tx.category || '').toLowerCase();
        const desc = (tx.description || '').toLowerCase();

        // Match direto pelo nome da classe
        if (cat === pafClass.name.toLowerCase() || cat.includes(pafClass.id)) return true;

        // Match por palavras-chave
        return pafClass.keywords.some(kw => cat.includes(kw) || desc.includes(kw));
      });

      const spentValue = matchingTxs.reduce((sum, t) => sum + (Number(t.value) || 0), 0);
      const remainingValue = pafClass.budgetedValue - spentValue;
      const executionPercent = pafClass.budgetedValue > 0 ? (spentValue / pafClass.budgetedValue) * 100 : 0;

      let status: 'safe' | 'warning' | 'danger';
      if (executionPercent >= 100) {
        status = 'danger';
      } else if (executionPercent >= 80) {
        status = 'warning';
      } else {
        status = 'safe';
      }

      return {
        ...pafClass,
        spentValue,
        remainingValue,
        executionPercent,
        status,
        transactions: matchingTxs
      };
    });
  }, [ruTransactions]);

  // Totais Gerais
  const totals = useMemo(() => {
    const custeioClasses = classesWithStats.filter(c => c.group === 'CUSTEIO');
    const capitalClasses = classesWithStats.filter(c => c.group === 'CAPITAL');

    const custeioBudget = custeioClasses.reduce((acc, c) => acc + c.budgetedValue, 0);
    const custeioSpent = custeioClasses.reduce((acc, c) => acc + c.spentValue, 0);

    const capitalBudget = capitalClasses.reduce((acc, c) => acc + c.budgetedValue, 0);
    const capitalSpent = capitalClasses.reduce((acc, c) => acc + c.spentValue, 0);

    const totalBudget = custeioBudget + capitalBudget;
    const totalSpent = custeioSpent + capitalSpent;

    return {
      custeioBudget,
      custeioSpent,
      custeioRemaining: custeioBudget - custeioSpent,
      custeioPct: custeioBudget > 0 ? (custeioSpent / custeioBudget) * 100 : 0,

      capitalBudget,
      capitalSpent,
      capitalRemaining: capitalBudget - capitalSpent,
      capitalPct: capitalBudget > 0 ? (capitalSpent / capitalBudget) * 100 : 0,

      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      totalPct: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }, [classesWithStats]);

  // Classes filtradas para exibição
  const filteredClasses = useMemo(() => {
    return classesWithStats.filter(c => {
      const matchGroup = selectedGroup === 'ALL' || c.group === selectedGroup;
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.examples.some(ex => ex.toLowerCase().includes(query));
      return matchGroup && matchSearch;
    });
  }, [classesWithStats, selectedGroup, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* CABEÇALHO DO PLANO OFICIAL SYDLE */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-600/30 text-blue-300 border border-blue-400/30 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Target size={12} /> Plano Oficial Homologado • SEDUC-MT
              </span>
              <span className="px-3 py-1 bg-white/10 text-white/70 border border-white/10 rounded-full text-[9px] font-bold uppercase">
                SYDLE Protocolo: 089416/2026 (L56NC1)
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
              Plano de Aplicação Financeira (PAF 2026)
            </h2>
            <p className="text-xs text-white/60 max-w-3xl leading-relaxed">
              Painel de governança para acompanhar o cumprimento das previsões orçamentárias por <strong>Classe de Material</strong> da Escola Estadual André Antônio Maggi, evitando desvios de finalidade e garantindo a aprovação da Prestação de Contas.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 no-print">
            <button
              onClick={() => window.print()}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Printer size={16} />
              <span>Imprimir Acompanhamento PAF</span>
            </button>
          </div>
        </div>

        {/* CARDS RESUMO DO PLANO: CUSTEIO, CAPITAL E TOTAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          
          {/* TOTAL GERAL DO PLANO */}
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Previsão Total do Plano</p>
              <span className="text-[9px] font-black text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full">PAF Geral</span>
            </div>
            <p className="text-2xl font-black text-white">
              R$ {totals.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex justify-between items-center text-[10px] font-bold text-white/60 mt-3 pt-3 border-t border-white/10">
              <span>Executado: R$ {totals.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-emerald-400 font-black">{totals.totalPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(totals.totalPct, 100)}%` }}></div>
            </div>
          </div>

          {/* CUSTEIO DO PLANO */}
          <div className="bg-blue-950/40 p-6 rounded-3xl border border-blue-500/20 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Custeio Previsto (17 Classes)</p>
              <span className="text-[9px] font-black text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full">Consumo / Serviços</span>
            </div>
            <p className="text-2xl font-black text-blue-400">
              R$ {totals.custeioBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex justify-between items-center text-[10px] font-bold text-blue-200 mt-3 pt-3 border-t border-white/10">
              <span>Saldo Restante: R$ {totals.custeioRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="font-black">{totals.custeioPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-blue-900/50 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(totals.custeioPct, 100)}%` }}></div>
            </div>
          </div>

          {/* CAPITAL DO PLANO */}
          <div className="bg-purple-950/40 p-6 rounded-3xl border border-purple-500/20 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Capital Previsto (3 Classes)</p>
              <span className="text-[9px] font-black text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full">Bens Permanentes</span>
            </div>
            <p className="text-2xl font-black text-purple-400">
              R$ {totals.capitalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex justify-between items-center text-[10px] font-bold text-purple-200 mt-3 pt-3 border-t border-white/10">
              <span>Saldo Restante: R$ {totals.capitalRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="font-black">{totals.capitalPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-purple-900/50 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.min(totals.capitalPct, 100)}%` }}></div>
            </div>
          </div>

        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-lg backdrop-blur-md no-print">
        
        {/* Grupos Custeio / Capital */}
        <div className="flex items-center gap-2 p-1 bg-black/20 rounded-2xl border border-white/10 w-full sm:w-auto">
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              selectedGroup === 'ALL' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            Todas as Classes ({classesWithStats.length})
          </button>
          <button
            onClick={() => setSelectedGroup('CUSTEIO')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              selectedGroup === 'CUSTEIO' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-white/50 hover:text-white'
            }`}
          >
            Custeio (17)
          </button>
          <button
            onClick={() => setSelectedGroup('CAPITAL')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              selectedGroup === 'CAPITAL' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-white/50 hover:text-white'
            }`}
          >
            Capital (3)
          </button>
        </div>

        {/* Busca por termo */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar classe, item ou exemplo..."
            className="w-full pl-11 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* LISTA / GRID DAS CLASSES DE MATERIAL DO PAF */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClasses.map(pafClass => {
          const isCapital = pafClass.group === 'CAPITAL';
          const isExceeded = pafClass.spentValue > pafClass.budgetedValue;

          return (
            <div
              key={pafClass.id}
              className={`p-6 rounded-[2rem] border shadow-xl backdrop-blur-md transition-all hover:scale-[1.01] flex flex-col justify-between ${
                isExceeded
                  ? 'bg-rose-950/30 border-rose-500/40'
                  : isCapital
                  ? 'bg-purple-950/20 border-purple-500/20 hover:border-purple-500/40'
                  : 'bg-white/5 border-white/10 hover:border-blue-500/30'
              }`}
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                    isCapital ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {isCapital ? '🏛️ CAPITAL' : '📦 CUSTEIO'}
                  </span>

                  <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase inline-flex items-center gap-1 ${
                    pafClass.status === 'danger'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : pafClass.status === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {pafClass.status === 'danger' ? (
                      <>
                        <AlertCircle size={11} />
                        <span>{pafClass.executionPercent.toFixed(0)}% • Limite Atingido</span>
                      </>
                    ) : pafClass.status === 'warning' ? (
                      <>
                        <AlertCircle size={11} />
                        <span>{pafClass.executionPercent.toFixed(0)}% • Atenção</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={11} />
                        <span>{pafClass.executionPercent.toFixed(0)}% • Regular</span>
                      </>
                    )}
                  </span>
                </div>

                <h3 className="text-base font-black text-white uppercase tracking-tight line-clamp-2 min-h-[3rem]">
                  {pafClass.name}
                </h3>

                <p className="text-xs text-white/60 line-clamp-2 mt-1 leading-relaxed">
                  {pafClass.description}
                </p>

                {/* Valores Orçado vs Gasto */}
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/50 uppercase">Previsto no PAF:</span>
                    <span className="text-sm font-black text-white">
                      R$ {pafClass.budgetedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/50 uppercase">Executado (Gasto):</span>
                    <span className="text-sm font-black text-blue-300">
                      R$ {pafClass.spentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-[10px] font-black uppercase text-white/70">Saldo Disponível:</span>
                    <span className={`text-sm font-black ${pafClass.remainingValue < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      R$ {pafClass.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pafClass.status === 'danger'
                          ? 'bg-rose-500'
                          : pafClass.status === 'warning'
                          ? 'bg-amber-500'
                          : isCapital
                          ? 'bg-purple-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(pafClass.executionPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ações do Card */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setDetailModalClass(pafClass)}
                  className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                >
                  <Info size={13} />
                  <span>Ver Detalhes ({pafClass.transactions.length})</span>
                </button>

                {onOpenNewExpenseWithClass && (
                  <button
                    type="button"
                    onClick={() => onOpenNewExpenseWithClass(pafClass)}
                    className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-md ${
                      isCapital
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    }`}
                  >
                    <Plus size={13} />
                    <span>Lançar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE DETALHAMENTO DA CLASSE DE MATERIAL */}
      {detailModalClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            
            {/* Header */}
            <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-block mb-2 ${
                  detailModalClass.group === 'CAPITAL' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {detailModalClass.group === 'CAPITAL' ? '🏛️ CAPITAL' : '📦 CUSTEIO'}
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">
                  {detailModalClass.name}
                </h3>
              </div>

              <button
                onClick={() => setDetailModalClass(null)}
                className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={22} />
              </button>
            </div>

            {/* Corpo */}
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Descrição e Itens Permitidos */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Finalidade & Descrição Oficial do Plano (SYDLE):
                </p>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {detailModalClass.description}
                </p>

                <div className="pt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Exemplos de Itens Previstos nesta Classe:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailModalClass.examples.map((ex, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-700/80 text-slate-200 rounded-lg text-[10px] font-bold">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quadro Financeiro da Classe */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <p className="text-[9px] font-black uppercase text-slate-400">Previsto no PAF</p>
                  <p className="text-lg font-black text-white mt-1">
                    R$ {detailModalClass.budgetedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <p className="text-[9px] font-black uppercase text-slate-400">Total Já Gasto</p>
                  <p className="text-lg font-black text-blue-400 mt-1">
                    R$ {(classesWithStats.find(c => c.id === detailModalClass.id)?.spentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <p className="text-[9px] font-black uppercase text-slate-400">Saldo Restante</p>
                  <p className="text-lg font-black text-emerald-400 mt-1">
                    R$ {(classesWithStats.find(c => c.id === detailModalClass.id)?.remainingValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Lista de Transações Lançadas nesta Classe */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Lançamentos Vinculados no Livro Caixa (Recurso Único):
                  </p>
                  <span className="text-xs font-bold text-slate-400">
                    {classesWithStats.find(c => c.id === detailModalClass.id)?.transactions.length || 0} despesa(s)
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {(classesWithStats.find(c => c.id === detailModalClass.id)?.transactions || []).length === 0 ? (
                    <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
                      <p className="text-xs text-slate-400 font-bold">
                        Nenhuma despesa lançada nesta classe até o momento.
                      </p>
                    </div>
                  ) : (
                    classesWithStats
                      .find(c => c.id === detailModalClass.id)
                      ?.transactions.map(tx => (
                        <div
                          key={tx.id}
                          className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center gap-4 text-xs"
                        >
                          <div>
                            <p className="font-black text-white uppercase">{tx.description}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Data: {tx.date} {tx.invoiceNumber ? `• NF: ${tx.invoiceNumber}` : ''}
                            </p>
                          </div>
                          <span className="font-black text-rose-400 shrink-0">
                            - R$ {tx.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-950/60 border-t border-white/5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetailModalClass(null)}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Fechar
              </button>

              {onOpenNewExpenseWithClass && (
                <button
                  type="button"
                  onClick={() => {
                    const cls = detailModalClass;
                    setDetailModalClass(null);
                    onOpenNewExpenseWithClass(cls);
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <Plus size={14} />
                  <span>Lançar Despesa nesta Classe</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PAFPlanManager;
