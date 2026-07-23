
import React, { useState, useEffect } from 'react';
import {
  CookingPot,
  Calculator,
  Globe,
  Users,
  CalendarDays,
  Library,
  HardHat,
  Hammer,
  ShieldCheck,
  PhoneCall,
  HeartHandshake,
  Landmark,
  LogOut,
  User as UserIcon,
  Settings,
  GraduationCap
} from 'lucide-react';
import { ModuleTypeExtended } from '../App';
import { User, AccessLog } from '../types';
import WelcomeDashboard from './WelcomeDashboard';
import ProfileModal from './ProfileModal';

interface HubProps {
  user: User;
  onLogout: () => void;
  onModuleSelect: (module: ModuleTypeExtended) => void;
  onUserUpdate: (updatedUser: User) => void;
}

const Hub: React.FC<HubProps> = ({ user, onLogout, onModuleSelect, onUserUpdate }) => {
  const [dynamicPermissions, setDynamicPermissions] = useState<Record<string, string[]>>({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const loadPermissions = () => {
      try {
        const saved = localStorage.getItem('portal_module_permissions_v5');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setDynamicPermissions(parsed);
          return;
        }
      } catch (e) {
        console.error("Error loading permissions:", e);
      }

      // Permissões Padrão Iniciais
      const defaults = {
        'GESTAO': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'psychosocial', 'pedagogical', 'teacher', 'scheduling', 'library', 'almoxarifado', 'limpeza', 'patrimonio', 'special_education', 'civico_militar', 'training'],
        'PROFESSOR': ['teacher', 'scheduling', 'library', 'almoxarifado', 'civico_militar', 'training'],
        'SECRETARIA': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'special_education', 'civico_militar', 'training'],
        'PSICOSSOCIAL': ['psychosocial', 'busca_ativa', 'scheduling', 'special_education', 'teacher', 'training'],
        'MANUTENCAO': ['limpeza', 'training'],
        'AAE': ['merenda', 'limpeza', 'almoxarifado', 'training'],
        'AAE_LIMPEZA': ['limpeza', 'almoxarifado', 'training'],
        'AEE_NUTRICAO': ['merenda', 'almoxarifado', 'training'],
        'TAE': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'special_education', 'civico_militar', 'training']
      };
      localStorage.setItem('portal_module_permissions_v5', JSON.stringify(defaults));
      setDynamicPermissions(defaults);
    };

    loadPermissions();
    window.addEventListener('storage', loadPermissions);
    return () => window.removeEventListener('storage', loadPermissions);
  }, []);

  const allModules = [
    { id: 'secretariat', title: 'Secretaria', status: 'Processos OK', statusColor: 'indigo', icon: <Landmark size={20} /> },
    { id: 'merenda', title: 'Merenda Escolar', status: 'Estoque OK', statusColor: 'emerald', icon: <CookingPot size={20} /> },
    { id: 'finance', title: 'Financeiro', status: 'Saldo Ativo', statusColor: 'blue', icon: <Calculator size={20} /> },
    { id: 'busca_ativa', title: 'Busca Ativa', status: 'Alertas', statusColor: 'red', icon: <PhoneCall size={20} /> },
    { id: 'psychosocial', title: 'Mediação & Apoio', status: 'Equipe Ativa', statusColor: 'rose', icon: <HeartHandshake size={20} /> },
    { id: 'pedagogical', title: 'Coordenação Pedagógica', status: 'Coordenação', statusColor: 'purple', icon: <Globe size={20} /> },
    { id: 'teacher', title: 'Área do Professor', status: 'Diário', statusColor: 'emerald', icon: <Users size={20} /> },
    { id: 'scheduling', title: 'Agendas', status: 'Reservas', statusColor: 'fuchsia', icon: <CalendarDays size={20} /> },
    { id: 'library', title: 'Biblioteca', status: 'Acervo', statusColor: 'indigo', icon: <Library size={20} /> },
    { id: 'almoxarifado', title: 'Almoxarifado', status: 'Materiais', statusColor: 'orange', icon: <HardHat size={20} /> },
    { id: 'limpeza', title: 'Manutenção', status: 'Operacional', statusColor: 'emerald', icon: <Hammer size={20} /> },
    { id: 'patrimonio', title: 'Patrimônio', status: 'Auditado', statusColor: 'blue', icon: <ShieldCheck size={20} /> },
    { id: 'special_education', title: 'Sala de Recursos e APA', status: 'AEE', statusColor: 'pink', icon: <UserIcon size={20} /> },
    { id: 'civico_militar', title: 'Cívico-Militar', status: 'Rotina OK', statusColor: 'blue', icon: <ShieldCheck size={20} /> },
    { id: 'training', title: 'Formação & Cursos', status: 'Capacitação', statusColor: 'violet', icon: <GraduationCap size={20} /> },
    { id: 'settings', title: 'Configurações', status: 'Administração', statusColor: 'indigo', icon: <Settings size={20} />, adminOnly: true },
  ];

  // Regra de Ouro: GESTAO e ADMINISTRADOR sempre veem tudo.
  // Outros cargos seguem o mapeamento dinâmico baseado na Função Atual.
  const isAdmin = user.role === 'GESTAO' || user.role === 'ADMINISTRADOR';
  const allowedModules = allModules.filter(mod => {
    // Restrição específica para a servidora Luzia conforme solicitado
    const isLuzia = user.name?.toUpperCase().includes('LUZIA') || 
                    user.login?.toUpperCase().includes('LUZIA');
    
    if (isLuzia) {
      return ['scheduling', 'library'].includes(mod.id);
    }

    // Restrição específica para a professora Kamila da Silva Santos
    const isKamila = user.name?.toUpperCase().includes('KAMILA DA SILVA SANTOS') || 
                     user.login === '04713754110';
    
    if (isKamila) {
      return ['teacher', 'scheduling'].includes(mod.id);
    }

    // Restrição específica para o servidor Genivaldo conforme solicitado (Manutenção, Formação e Patrimônio)
    const isGenivaldo = user.name?.toUpperCase().includes('GENIVALDO') || 
                        user.login?.toUpperCase().includes('GENIVALDO');
    
    if (isGenivaldo) {
      return ['limpeza', 'training', 'patrimonio'].includes(mod.id);
    }

    const isDanubia = user.name?.toUpperCase().includes('DANUBIA') || 
                      user.name?.toUpperCase().includes('DANÚBIA') ||
                      user.login?.toUpperCase().includes('DANUBIA');
                      
    const isVeraLucia = user.name?.toUpperCase().includes('VERA LUCIA ARQUINO') || 
                        user.name?.toUpperCase().includes('VERA LÚCIA ARQUINO');

    const isAnaiara = user.name?.toUpperCase().includes('ANAIARA') || 
                      user.login?.replace(/\D/g, '') === '04589046199' ||
                      user.cpf?.replace(/\D/g, '') === '04589046199';

    if (mod.adminOnly && !isAdmin) return false;
    if (isAdmin) return true;

    if (isAnaiara && ['scheduling', 'psychosocial'].includes(mod.id)) {
      return true;
    }

    if (isDanubia && ['teacher', 'scheduling'].includes(mod.id)) {
      return true;
    }
    
    if (isVeraLucia && ['library', 'scheduling'].includes(mod.id)) {
      return true;
    }

    if (isVeraLucia && ['almoxarifado', 'limpeza'].includes(mod.id)) {
      return false;
    }

    const isCelioOrLucileia = user.name?.toUpperCase().includes('CELIO RICARDO') || 
                              user.name?.toUpperCase().includes('LUCILEIA');

    if (isCelioOrLucileia && mod.id === 'secretariat') {
      return true;
    }

    const isCivicoTeam = user.name?.toUpperCase().includes('RAUL') || 
                         user.name?.toUpperCase().includes('JOÃO VITOR') ||
                         user.name?.toUpperCase().includes('JOAO VITOR') ||
                         user.name?.toUpperCase().includes('ELIEZER') ||
                         user.name?.toUpperCase().includes('MARCELO');

    if (isCivicoTeam && ['civico_militar', 'scheduling', 'training'].includes(mod.id)) {
      return true;
    }

    // Prioriza a Função para permissões dinâmicas, fallback para Role
    const permissionKey = user.jobFunction || user.role;
    const rolePermissions = dynamicPermissions[permissionKey] || [];
    return rolePermissions.includes(mod.id);
  });

  const recordAccessLog = (moduleId: string, moduleTitle: string) => {
    try {
      const logs: AccessLog[] = JSON.parse(localStorage.getItem('access_logs_v1') || '[]');
      logs.unshift({
        id: `log-${Date.now()}`,
        userId: user.id,
        userName: user.name || 'Usuário',
        role: user.role,
        module: moduleTitle,
        timestamp: Date.now(),
        action: 'ACCESS_MODULE'
      });
      localStorage.setItem('access_logs_v1', JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error("Error recording access log:", e);
    }
  };

  const handleModuleClick = (module: typeof allModules[0]) => {
    try {
      recordAccessLog(module.id, module.title);
      onModuleSelect(module.id as ModuleTypeExtended);
    } catch (e) {
      console.error("Error handling module click:", e);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Erro ao tentar ativar modo tela cheia: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative w-full overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 fixed"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/10 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite] fixed"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-200/10 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite] fixed"></div>
      </div>

      <div className="relative z-10 flex min-h-screen w-full min-w-0">
        {/* SIDEBAR NAVEGAÇÃO HUB (Glass) - Escondido em mobile, visível em lg */}
        <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-24 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 flex-col items-center py-10 gap-8 no-print z-50 shadow-sm">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white font-black border border-white/20">AM-v2</div>

          <nav className="flex-1 flex flex-col gap-4">
            {/* Navegação removida pois agora é tudo em uma tela só */}
          </nav>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-4 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100/55 transition-all"
              title="Meu Perfil"
            >
              <UserIcon size={24} />
            </button>
            {isAdmin && (
              <button
                onClick={() => onModuleSelect('settings')}
                className="p-4 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100/55 transition-all"
                title="Configurações Gerais"
              >
                <Settings size={24} />
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-4 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Sair do Sistema"
            >
              <LogOut size={24} />
            </button>
          </div>
        </aside>

        <main className="lg:pl-24 flex-1 min-h-screen p-3 md:p-8 lg:p-12 overflow-x-hidden w-full min-w-0">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
            <WelcomeDashboard
              user={user}
              onLogout={onLogout}
              onModuleSelect={(moduleId) => {
                const module = allowedModules.find(m => m.id === moduleId);
                if (module) handleModuleClick(module);
              }}
              modules={allowedModules}
              onProfileOpen={() => setIsProfileOpen(true)}
            />
          </div>
        </main>
      </div>

      <ProfileModal
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdate={onUserUpdate}
      />
    </div>
  );
};

export default Hub;
