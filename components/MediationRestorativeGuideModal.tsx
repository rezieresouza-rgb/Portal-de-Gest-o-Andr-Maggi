import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Users,
  AlertTriangle,
  Lightbulb,
  Scale
} from 'lucide-react';

interface MediationRestorativeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestions?: (questionsText: string) => void;
}

interface ScriptTopic {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  questions: {
    phase: string;
    target: 'AUTOR' | 'VITIMA' | 'AMBOS' | 'RESPONSAVEIS';
    question: string;
    tip: string;
  }[];
  restorativeAgreements: string[];
}

const RESTORATIVE_SCRIPTS: ScriptTopic[] = [
  {
    id: 'geral',
    title: 'Roteiro Clássico de Perguntas Restaurativas (SEDUC/MT)',
    category: 'Universal',
    icon: 'Scale',
    description: 'Roteiro oficial de 4 fases para restabelecer a comunicação, responsabilização voluntária e reparação do dano.',
    questions: [
      {
        phase: 'Fase 1: Contextualização dos Fatos',
        target: 'AMBOS',
        question: 'O que aconteceu, sob a sua perspectiva, desde o início da situação?',
        tip: 'Garanta tempo igual de fala sem interrupções da outra parte.'
      },
      {
        phase: 'Fase 2: Pensamentos e Sentimentos',
        target: 'AMBOS',
        question: 'O que você estava pensando e sentindo no momento em que tudo aconteceu? E como se sente agora?',
        tip: 'Ajude o estudante a nomear emoções (raiva, medo, vergonha, frustração).'
      },
      {
        phase: 'Fase 3: Impacto e Empatia',
        target: 'AMBOS',
        question: 'Quem você acha que foi afetado pelo que aconteceu e de que maneira?',
        tip: 'Estimule a percepção de impacto além dos dois (colegas de sala, professores, família).'
      },
      {
        phase: 'Fase 4: Reparação e Futuro',
        target: 'AMBOS',
        question: 'O que você acredita que precisa ser feito para reparar a situação e garantir que isso não se repita?',
        tip: 'Os acordos devem partir dos próprios alunos, não sendo impostos pelo mediador.'
      }
    ],
    restorativeAgreements: [
      'Pedido formal de desculpas em particular ou em círculo.',
      'Compromisso de não alimentar boatos ou provocações.',
      'Espaço seguro de distanciamento respeitoso durante intervalos.',
      'Canal aberto de diálogo com o Mediador caso haja desconforto futuro.'
    ]
  },
  {
    id: 'bullying_cyber',
    title: 'Bullying, Cyberbullying & Redes Sociais',
    category: 'Convivência Digital',
    icon: 'MessageSquare',
    description: 'Para casos de mensagens ofensivas, grupos de WhatsApp, apelidos pejorativos ou exclusão sistemática.',
    questions: [
      {
        phase: 'Fase 1: Origem do Conteúdo',
        target: 'AMBOS',
        question: 'Como essa postagem / mensagem / apelido começou e qual era a intenção inicial?',
        tip: 'Identifique se foi brincadeira que escalou ou perseguição intencional.'
      },
      {
        phase: 'Fase 2: A Tomada de Consciência',
        target: 'AUTOR',
        question: 'Você imaginava o peso que essas palavras teriam quando a outra pessoa lesse?',
        tip: 'Evite tom acusatório; convide à reflexão sobre a permanência do registro digital.'
      },
      {
        phase: 'Fase 3: Acolhimento do Sentimento',
        target: 'VITIMA',
        question: 'Como isso afetou sua rotina escolar, suas amizades e sua vontade de vir para a escola?',
        tip: 'Valide a dor e o constrangimento sem minimizar o relato.'
      },
      {
        phase: 'Fase 4: Ação de Reparação Digital',
        target: 'AUTOR',
        question: 'Como você pode esclarecer a verdade no mesmo grupo / ambiente onde o dano foi causado?',
        tip: 'Retratação clara e exclusão imediata de mídias ou grupos depreciativos.'
      }
    ],
    restorativeAgreements: [
      'Exclusão imediata de fotos, stickers, áudios ou postagens ofensivas.',
      'Retratação no grupo de mensagens ou perante a turma se necessário.',
      'Compromisso formal de bloqueio de comentários sobre a vida pessoal do colega.',
      'Acompanhamento quinzenal do mediador com a vítima para checar segurança.'
    ]
  },
  {
    id: 'docente_aluno',
    title: 'Atrito / Desrespeito entre Estudante e Professor',
    category: 'Relação Pedagógica',
    icon: 'Users',
    description: 'Para situações de desacato, recusa de atividades, enfrentamento verbal em sala de aula.',
    questions: [
      {
        phase: 'Fase 1: O Momento do Conflito',
        target: 'AUTOR',
        question: 'O que estava acontecendo com você antes daquele momento da aula que gerou a reação explosiva?',
        tip: 'Geralmente há sobrecarga emocional, problemas familiares ou frustração com a matéria.'
      },
      {
        phase: 'Fase 2: O Papel da Autoridade e Respeito',
        target: 'AUTOR',
        question: 'Como você avalia o impacto da sua atitude para o andamento da aula e para os outros 30 colegas?',
        tip: 'Trabalhe a noção de coletividade e o papel do educador.'
      },
      {
        phase: 'Fase 3: Escuta do Educador',
        target: 'VITIMA',
        question: 'Professor(a), como essa situação impactou seu planejamento e o ambiente da turma?',
        tip: 'Permita que o docente expresse sua preocupação pedagógica e humana.'
      },
      {
        phase: 'Fase 4: Repactuação de Convivência',
        target: 'AMBOS',
        question: 'Como podemos combinar um sinal ou pausa caso você sinta que vai perder a calma em uma próxima aula?',
        tip: 'Crie uma estratégia prática preventiva (ex: beber água, respirar antes de responder).'
      }
    ],
    restorativeAgreements: [
      'Pedido de desculpas respeitoso ao professor no início da próxima aula.',
      'Acordo de combinar um código/estratégia de calma antes de qualquer confronto.',
      'Compromisso com entrega das tarefas pendentes da disciplina.',
      'Mediação de acompanhamento com a coordenação pedagógica.'
    ]
  },
  {
    id: 'brigas_fisicas',
    title: 'Agressão Física / Conflito Reincidente no Pátio',
    category: 'Segurança & Clima',
    icon: 'AlertTriangle',
    description: 'Para brigas corporais, ameaças de agressão pós-aula ou rivalidades territoriais/turmas.',
    questions: [
      {
        phase: 'Fase 1: O Gatilho e Antecedentes',
        target: 'AMBOS',
        question: 'O que já vinha acumulando entre vocês antes de chegar às vias de fato?',
        tip: 'Identifique histórico prévio, provocações indiretas ou terceiros incentivando.'
      },
      {
        phase: 'Fase 2: Os Riscos Assumidos',
        target: 'AMBOS',
        question: 'Vocês têm noção de quais seriam as consequências físicas, legais e escolares se a briga continuasse?',
        tip: 'Aborde o regimento escolar, integridade física e o envolvimento de responsáveis/polícia.'
      },
      {
        phase: 'Fase 3: O Papel dos Espectadores',
        target: 'AMBOS',
        question: 'Como a torcida e as pessoas ao redor influenciaram a decisão de não recuar?',
        tip: 'Desconstrua a pressão dos pares e a necessidade de "manter a honra" pela violência.'
      },
      {
        phase: 'Fase 4: Pacto de Não-Agressão Estrita',
        target: 'AMBOS',
        question: 'O que cada um de vocês se compromete a fazer agora para garantir a integridade mútua?',
        tip: 'Assinatura obrigatória do Termo de Não-Agressão com ciência dos pais.'
      }
    ],
    restorativeAgreements: [
      'Assinatura do Termo de Não-Agressão e Respeito Mútuo.',
      'Compromisso de não recorrer a amigos ou terceiros para retaliação fora da escola.',
      'Ciência e assinatura dos responsáveis legais em ata de reunião.',
      'Encaminhamento à Coordenação Cívico-Militar para monitoramento de atitude.'
    ]
  }
];

export const MediationRestorativeGuideModal: React.FC<MediationRestorativeGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestions
}) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>('geral');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentScript = RESTORATIVE_SCRIPTS.find(s => s.id === selectedScriptId) || RESTORATIVE_SCRIPTS[0];

  const handleCopyQuestions = () => {
    const text = `--- ROTEIRO RESTAURATIVO: ${currentScript.title.toUpperCase()} ---\n\n` +
      currentScript.questions.map((q, i) => `${i + 1}. [${q.phase}] (${q.target})\nPergunta: "${q.question}"\nOrientação técnica: ${q.tip}\n`).join('\n') +
      `\nSugestões de Acordos Restaurativos:\n` +
      currentScript.restorativeAgreements.map(a => `- ${a}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);

    if (onSelectQuestions) {
      onSelectQuestions(text);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-slate-800">
        
        {/* HEADER */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-2xl shadow-lg">
              <BookOpen size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-400/30">
                  SEDUC/MT • Justiça Restaurativa
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
                Guia Prático de Perguntas Restaurativas
              </h2>
              <p className="text-slate-300 text-xs font-medium">
                Roteiros orientados para condução de Círculos de Paz, escuta empática e reparação do dano
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* CORPO: SIDEBAR DE TEMAS + CONTEÚDO DO ROTEIRO */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Navegação por Tema */}
          <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 p-4 space-y-2 overflow-y-auto shrink-0 custom-scrollbar">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1">
              Selecione o Roteiro do Conflito:
            </p>
            {RESTORATIVE_SCRIPTS.map(script => {
              const isSelected = script.id === selectedScriptId;
              return (
                <button
                  key={script.id}
                  onClick={() => setSelectedScriptId(script.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    isSelected
                      ? 'bg-white border-indigo-200 shadow-md shadow-indigo-100/50 text-indigo-950 font-black'
                      : 'bg-transparent border-transparent hover:bg-slate-200/60 text-slate-600 font-bold'
                  }`}
                >
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-1.5 ${
                    isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {script.category}
                  </span>
                  <h4 className="text-xs uppercase leading-tight">{script.title}</h4>
                </button>
              );
            })}

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 space-y-2 mt-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Lightbulb size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">Postura do Mediador</span>
              </div>
              <p className="text-[10px] text-amber-900 leading-relaxed font-medium">
                • Jamais atribua culpa ou puna durante a sessão.<br />
                • Dê tempo para o silêncio e elaboração.<br />
                • Pergunte "Como consertar?" em vez de "Por que fez isso?".
              </p>
            </div>
          </div>

          {/* Área Principal de Exibição das Perguntas */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 custom-scrollbar bg-white">
            
            {/* Header do Roteiro Ativo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  {currentScript.category}
                </span>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mt-2">
                  {currentScript.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {currentScript.description}
                </p>
              </div>

              <button
                onClick={handleCopyQuestions}
                className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all flex items-center gap-2 border border-indigo-200 self-start sm:self-auto shrink-0"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {copied ? 'Roteiro Copiado!' : 'Copiar Roteiro'}
              </button>
            </div>

            {/* Lista das 4 Fases com Perguntas */}
            <div className="space-y-4">
              {currentScript.questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      {q.phase}
                    </span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                      q.target === 'AUTOR' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      q.target === 'VITIMA' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      Direcionado a: {q.target}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-black text-slate-900 leading-snug">
                      "{q.question}"
                    </p>
                  </div>

                  <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 italic">
                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                    <strong>Dica de Mediação:</strong> {q.tip}
                  </p>
                </div>
              ))}
            </div>

            {/* Sugestões de Acordos Reparadores */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900">
                <HeartHandshake size={18} className="text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Sugestões de Acordos & Compromissos para Este Roteiro
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {currentScript.restorativeAgreements.map((agreement, i) => (
                  <div key={i} className="flex items-start gap-2 bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-950 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{agreement}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
            <ShieldCheck size={14} className="text-indigo-600" />
            <span>Modelo alinhado à Portaria SEDUC de Mediação Escolar e Cultura de Paz</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Fechar Guia
          </button>
        </div>

      </div>
    </div>
  );
};

export default MediationRestorativeGuideModal;
