import React, { useState, useEffect } from 'react';
import {
  Home,
  CheckCircle2,
  Users,
  Volume2,
  Music,
  Calendar,
  FileText,
  Sparkles,
  LogOut,
  Menu,
  X,
  Drum,
  Award,
  ChevronRight,
  Maximize,
  Minimize
} from 'lucide-react';
import { User as UserType } from '../types';
import EducarteDashboard from '../components/EducarteDashboard';
import EducarteAttendance from '../components/EducarteAttendance';
import EducarteClassLog from '../components/EducarteClassLog';
import EducarteMembers from '../components/EducarteMembers';
import EducarteInstruments from '../components/EducarteInstruments';
import EducarteRepertoire from '../components/EducarteRepertoire';
import EducarteSchedule from '../components/EducarteSchedule';
import EducarteReports from '../components/EducarteReports';
import { BookOpen } from 'lucide-react';

interface EducarteModuleProps {
  user: UserType;
  onExit: () => void;
}

type SubTab = 'dashboard' | 'attendance' | 'class_log' | 'members' | 'instruments' | 'repertoire' | 'schedule' | 'reports';

// Dados Iniciais Demonstrativos de Alta Qualidade
const INITIAL_MEMBERS = [
  { id: '1', name: 'GABRIEL SOUZA LIMA', classroomName: '8º ANO A', shift: 'VESPERTINO (CONTRATURNO)', naipe: 'METAIS', instrument: 'Trompete (Bb)', level: 'AVANÇADO / SOLISTA', status: 'ATIVO', guardianName: 'MARIA SOUZA', guardianPhone: '(66) 99841-2233' },
  { id: '2', name: 'LUCAS OLIVEIRA SANTOS', classroomName: '9º ANO B', shift: 'VESPERTINO (CONTRATURNO)', naipe: 'METAIS', instrument: 'Trombone de Vara', level: 'INTERMEDIÁRIO', status: 'ATIVO', guardianName: 'JOAO SANTOS', guardianPhone: '(66) 99712-4455' },
  { id: '3', name: 'BEATRIZ ALMEIDA ROCHA', classroomName: '7º ANO A', shift: 'VESPERTINO (CONTRATURNO)', naipe: 'MADEIRAS', instrument: 'Saxofone Alto (Eb)', level: 'AVANÇADO / SOLISTA', status: 'ATIVO', guardianName: 'ANA ROCHA', guardianPhone: '(66) 99655-7788' },
  { id: '4', name: 'MATHEUS PEREIRA SILVA', classroomName: '8º ANO B', shift: 'VESPERTINO (CONTRATURNO)', naipe: 'PERCUSSÃO', instrument: 'Bumbo Marcial', level: 'CHEFE DE NAIPE', status: 'ATIVO', guardianName: 'CARLOS SILVA', guardianPhone: '(66) 99911-3322' },
  { id: '5', name: 'JULIA MARTINS COSTA', classroomName: '9º ANO A', shift: 'VESPERTINO (CONTRATURNO)', naipe: 'LINHA DE FRENTE', instrument: 'Baliza Principal', level: 'AVANÇADO / SOLISTA', status: 'ATIVO', guardianName: 'RENATA COSTA', guardianPhone: '(66) 99888-1122' },
  { id: '6', name: 'ARTHUR HENRIQUE DIAS', classroomName: '6º ANO A', shift: 'VESPERTINO (CONTRATURNO)', naipe: 'MADEIRAS', instrument: 'Clarinete (Bb)', level: 'INICIANTE', status: 'ATIVO', guardianName: 'FERNANDA DIAS', guardianPhone: '(66) 99777-6655' },
  { id: '7', name: 'VINICIUS SOUZA MACIEL', classroomName: '8º ANO A', shift: 'VESPERTINO (CONTRATURNO)', naipe: 'PERCUSSÃO', instrument: 'Quadriton / Quintiton', level: 'INTERMEDIÁRIO', status: 'ATIVO', guardianName: 'PAULO MACIEL', guardianPhone: '(66) 99666-3344' },
  { id: '8', name: 'ISABELA RAMOS NOGUEIRA', classroomName: '7º ANO B', shift: 'VESPERTINO (CONTRATURNO)', naipe: 'METAIS', instrument: 'Eufônio / Bombardino', level: 'INTERMEDIÁRIO', status: 'ATIVO', guardianName: 'CLAUDIA NOGUEIRA', guardianPhone: '(66) 99555-2211' },
];

const INITIAL_INSTRUMENTS = [
  { id: '1', name: 'Trompete em Bb Laqueado', naipe: 'METAIS', brand: 'Yamaha YTR-2330', serialNumber: 'YTR884920', condition: 'EXCELENTE', status: 'CAUTELADO', loanedToId: '1', loanedToName: 'GABRIEL SOUZA LIMA', loanDate: '2026-02-15' },
  { id: '2', name: 'Trombone de Vara Tenor', naipe: 'METAIS', brand: 'Weril Master', serialNumber: 'WR441928', condition: 'BOM', status: 'CAUTELADO', loanedToId: '2', loanedToName: 'LUCAS OLIVEIRA SANTOS', loanDate: '2026-02-15' },
  { id: '3', name: 'Saxofone Alto Eb Dourado', naipe: 'MADEIRAS', brand: 'Michael MAS40', serialNumber: 'MAS77123', condition: 'EXCELENTE', status: 'CAUTELADO', loanedToId: '3', loanedToName: 'BEATRIZ ALMEIDA ROCHA', loanDate: '2026-02-16' },
  { id: '4', name: 'Bumbo Marcial 22x14 com Colete', naipe: 'PERCUSSÃO', brand: 'Luen Marcial Pro', serialNumber: 'LN22019', condition: 'BOM', status: 'CAUTELADO', loanedToId: '4', loanedToName: 'MATHEUS PEREIRA SILVA', loanDate: '2026-02-15' },
  { id: '5', name: 'Sousafone / Tuba Bb de Marcha', naipe: 'METAIS', brand: 'Weril', serialNumber: 'WR992100', condition: 'BOM', status: 'DISPONÍVEL' },
  { id: '6', name: 'Clarinete 17 Chaves Bb', naipe: 'MADEIRAS', brand: 'Eagle CL04', serialNumber: 'EG55291', condition: 'EXCELENTE', status: 'CAUTELADO', loanedToId: '6', loanedToName: 'ARTHUR HENRIQUE DIAS', loanDate: '2026-02-20' },
  { id: '7', name: 'Quadriton Marcial 8-10-12-13', naipe: 'PERCUSSÃO', brand: 'Luen', serialNumber: 'LN88391', condition: 'EXCELENTE', status: 'CAUTELADO', loanedToId: '7', loanedToName: 'VINICIUS SOUZA MACIEL', loanDate: '2026-02-18' },
  { id: '8', name: 'Pratos Marciais 14" Par', naipe: 'PERCUSSÃO', brand: 'Orion Cymbals', serialNumber: 'OR14092', condition: 'BOM', status: 'DISPONÍVEL' },
];

const INITIAL_REPERTOIRE = [
  { id: '1', title: 'HINO NACIONAL BRASILEIRO', composer: 'Francisco Manoel da Silva', genre: 'HINOS CÍVICOS', status: 'PRONTA P/ APRESENTAÇÃO', difficulty: 'MÉDIO (INTERMEDIÁRIO)', notes: 'Arranjo oficial para banda escolar e desfile cívico.' },
  { id: '2', title: 'HINO DO ESTADO DE MATO GROSSO', composer: 'Emílio Blum', genre: 'HINOS CÍVICOS', status: 'PRONTA P/ APRESENTAÇÃO', difficulty: 'MÉDIO (INTERMEDIÁRIO)', notes: 'Execução em eventos oficiais da SEDUC.' },
  { id: '3', title: 'DOBRADO BATISTA DE MELO', composer: 'Manoel Alves', genre: 'DOBRADOS MARCIONAIS', status: 'PRONTA P/ APRESENTAÇÃO', difficulty: 'AVANÇADO', notes: 'Peça principal para entrada e evolução da banda.' },
  { id: '4', title: 'DOBRADO DOIS CORAÇÕES', composer: 'Pedro Salgado', genre: 'DOBRADOS MARCIONAIS', status: 'EM ESTUDO', difficulty: 'AVANÇADO', notes: 'Trabalhando articulação dos metais no solo central.' },
  { id: '5', title: 'ANUNCIAÇÃO (MARCHA ADAPTADA)', composer: 'Alceu Valença', genre: 'MPB / MÚSICA POPULAR', status: 'PRONTA P/ APRESENTAÇÃO', difficulty: 'FÁCIL (INICIANTE)', notes: 'Sucesso garantido nas apresentações escolares.' },
];

const INITIAL_EVENTS = [
  { id: '1', title: 'DESFILE CÍVICO DE 7 DE SETEMBRO', type: 'DESFILE CIVICO', date: '2026-09-07', time: '07:30', location: 'Avenida dos Jacarandás', targetGroup: 'Toda a Banda & Corpo Coreográfico', uniform: 'Uniforme de Gala Completo', transport: 'Concentração na Escola às 06h30' },
  { id: '2', title: 'APRESENTAÇÃO NO ANIVERSÁRIO DA ESCOLA', type: 'APRESENTACAO', date: '2026-10-15', time: '09:00', location: 'Pátio Central E.E. André Maggi', targetGroup: 'Toda a Banda', uniform: 'Camiseta do Projeto Educarte', transport: 'Na própria escola' },
  { id: '3', title: 'ENCONTRO REGIONAL DE BANDAS E FANFARRAS DRE SINOP', type: 'FESTIVAL / CONCURSO', date: '2026-11-20', time: '14:00', location: 'Ginásio Olímpico Municipal', targetGroup: 'Banda Principal e Balizas', uniform: 'Uniforme de Gala Oficial', transport: 'Ônibus cedido pela DRE Sinop' },
];

const EducarteModule: React.FC<EducarteModuleProps> = ({ user, onExit }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados com persistência em LocalStorage
  const [members, setMembers] = useState<any[]>(() => {
    const saved = localStorage.getItem('educarte_members_v1');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [instruments, setInstruments] = useState<any[]>(() => {
    const saved = localStorage.getItem('educarte_instruments_v1');
    return saved ? JSON.parse(saved) : INITIAL_INSTRUMENTS;
  });

  const [repertoire, setRepertoire] = useState<any[]>(() => {
    const saved = localStorage.getItem('educarte_repertoire_v1');
    return saved ? JSON.parse(saved) : INITIAL_REPERTOIRE;
  });

  const [events, setEvents] = useState<any[]>(() => {
    const saved = localStorage.getItem('educarte_events_v1');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<any[]>(() => {
    const saved = localStorage.getItem('educarte_attendance_records_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar alterações
  const handleSaveMember = (member: any) => {
    setMembers(prev => {
      const exists = prev.some(m => m.id === member.id);
      const updated = exists ? prev.map(m => m.id === member.id ? member : m) : [member, ...prev];
      localStorage.setItem('educarte_members_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem('educarte_members_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveInstrument = (inst: any) => {
    setInstruments(prev => {
      const exists = prev.some(i => i.id === inst.id);
      const updated = exists ? prev.map(i => i.id === inst.id ? inst : i) : [inst, ...prev];
      localStorage.setItem('educarte_instruments_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteInstrument = (id: string) => {
    setInstruments(prev => {
      const updated = prev.filter(i => i.id !== id);
      localStorage.setItem('educarte_instruments_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSavePiece = (piece: any) => {
    setRepertoire(prev => {
      const exists = prev.some(p => p.id === piece.id);
      const updated = exists ? prev.map(p => p.id === piece.id ? piece : p) : [piece, ...prev];
      localStorage.setItem('educarte_repertoire_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeletePiece = (id: string) => {
    setRepertoire(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('educarte_repertoire_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveEvent = (evt: any) => {
    setEvents(prev => {
      const exists = prev.some(e => e.id === evt.id);
      const updated = exists ? prev.map(e => e.id === evt.id ? evt : e) : [evt, ...prev];
      localStorage.setItem('educarte_events_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('educarte_events_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Meu Painel Educarte', icon: Home, highlight: true },
    { id: 'attendance', label: 'Diário de Presença (Ensaios)', icon: CheckCircle2 },
    { id: 'class_log', label: 'Diário de Ensaios & Conteúdos', icon: BookOpen },
    { id: 'members', label: 'Integrantes & Naipes', icon: Users },
    { id: 'instruments', label: 'Acervo & Cautela de Instrumentos', icon: Volume2 },
    { id: 'repertoire', label: 'Repertório & Partituras', icon: Music },
    { id: 'schedule', label: 'Agenda & Apresentações', icon: Calendar },
    { id: 'reports', label: 'Relatórios & Certificados', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeSubTab) {
      case 'dashboard':
        return (
          <EducarteDashboard
            onNavigate={(t) => setActiveSubTab(t as SubTab)}
            members={members}
            attendanceRecords={attendanceRecords}
            instruments={instruments}
            events={events}
          />
        );
      case 'attendance':
        return (
          <EducarteAttendance
            user={user}
            members={members}
            onRefresh={() => {
              const saved = localStorage.getItem('educarte_attendance_records_v1');
              if (saved) setAttendanceRecords(JSON.parse(saved));
            }}
          />
        );
      case 'class_log':
        return (
          <EducarteClassLog
            user={user}
            repertoire={repertoire}
          />
        );
      case 'members':
        return (
          <EducarteMembers
            members={members}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
          />
        );
      case 'instruments':
        return (
          <EducarteInstruments
            instruments={instruments}
            members={members}
            onSaveInstrument={handleSaveInstrument}
            onDeleteInstrument={handleDeleteInstrument}
          />
        );
      case 'repertoire':
        return (
          <EducarteRepertoire
            repertoire={repertoire}
            onSavePiece={handleSavePiece}
            onDeletePiece={handleDeletePiece}
          />
        );
      case 'schedule':
        return (
          <EducarteSchedule
            events={events}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        );
      case 'reports':
        return (
          <EducarteReports
            members={members}
            instruments={instruments}
            attendanceRecords={attendanceRecords}
            events={events}
          />
        );
      default:
        return (
          <EducarteDashboard
            onNavigate={(t) => setActiveSubTab(t as SubTab)}
            members={members}
            attendanceRecords={attendanceRecords}
            instruments={instruments}
            events={events}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">

      {/* SIDEBAR EDUCARTE (Ambar / Dourado / Slate Escuro) */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-950 via-amber-950/90 to-slate-900 text-white flex flex-col no-print transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} border-r border-white/10 shadow-2xl`}>
        
        {/* LOGO & CABEÇALHO DA SIDEBAR */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Music size={22} />
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-tight block leading-tight text-amber-400">
                PROJETO EDUCARTE
              </span>
              <span className="text-[10px] text-amber-200/80 font-bold uppercase tracking-widest block">
                Banda & Fanfarra
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* PERFIL DO USUÁRIO NA SIDEBAR */}
        <div className="p-4 mx-4 my-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-black text-xs">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-black truncate text-white uppercase">{user.name}</p>
            <p className="text-[9px] text-amber-400 font-bold uppercase truncate">
              {user.role} • Regente / Instrutor
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO / ITENS DE MENU */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSubTab(item.id as SubTab);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-slate-950' : 'text-amber-400'} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>

        {/* BOTÃO SAIR / RETORNAR AO HUB */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white/5 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-white/5"
          >
            <LogOut size={16} /> Voltar ao Painel Geral
          </button>
        </div>

      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER SUPERIOR */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black uppercase text-slate-900 leading-tight">
                {menuItems.find(m => m.id === activeSubTab)?.label}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase">E.E. André Antônio Maggi • SEDUC-MT</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <LogOut size={14} /> Sair do Módulo
            </button>
          </div>
        </header>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>

      </main>

    </div>
  );
};

export default EducarteModule;
