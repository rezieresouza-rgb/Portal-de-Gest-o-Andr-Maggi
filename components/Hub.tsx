
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
  Settings
} from 'lucide-react';
import { ModuleTypeExtended } from '../App';
import { User, AccessLog } from '../types';
import WelcomeDashboard from './WelcomeDashboard';

interface HubProps {
  user: User;
  onLogout: () => void;
  onModuleSelect: (module: ModuleTypeExtended) => void;
}

const Hub: React.FC<HubProps> = ({ user, onLogout, onModuleSelect }) => {
  const [dynamicPermissions, setDynamicPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadPermissions = () => {
      const saved = localStorage.getItem('portal_module_permissions_v1');
      if (saved) {
        setDynamicPermissions(JSON.parse(saved));
      } else {
        // Permissões Padrão Iniciais
        const defaults = {
          'PROFESSOR': ['teacher', 'scheduling', 'library', 'almoxarifado'],
          'SECRETARIA': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'special_education'],
          'PSICOSSOCIAL': ['psychosocial', 'busca_ativa', 'scheduling', 'special_education'],
          'MANUTENCAO': ['limpeza'],
          'AAE': ['limpeza'],
          'TAE': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'special_education']
        };
        localStorage.setItem('portal_module_permissions_v1', JSON.stringify(defaults));
        setDynamicPermissions(defaults);
      }
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
    { id: 'pedagogical', title: 'Pedagógico', status: 'Coordenação', statusColor: 'purple', icon: <Globe size={20} /> },
    { id: 'teacher', title: 'Área do Professor', status: 'Diário', statusColor: 'emerald', icon: <Users size={20} /> },
    { id: 'scheduling', title: 'Agendas', status: 'Reservas', statusColor: 'fuchsia', icon: <CalendarDays size={20} /> },
    { id: 'library', title: 'Biblioteca', status: 'Acervo', statusColor: 'indigo', icon: <Library size={20} /> },
    { id: 'almoxarifado', title: 'Almoxarifado', status: 'Materiais', statusColor: 'orange', icon: <HardHat size={20} /> },
    { id: 'limpeza', title: 'Manutenção', status: 'Operacional', statusColor: 'emerald', icon: <Hammer size={20} /> },
    { id: 'patrimonio', title: 'Patrimônio', status: 'Auditado', statusColor: 'blue', icon: <ShieldCheck size={20} /> },
    { id: 'special_education', title: 'Sala de Recursos e APA', status: 'AEE', statusColor: 'pink', icon: <UserIcon size={20} /> },
    { id: 'settings', title: 'Configurações', status: 'Administração', statusColor: 'indigo', icon: <Settings size={20} />, adminOnly: true },
  ];

  // Regra de Ouro: GESTAO e ADMINISTRADOR sempre veem tudo.
  // Outros cargos seguem o mapeamento dinâmico.
  const isAdmin = user.role === 'GESTAO' || user.role === 'ADMINISTRADOR';
  const allowedModules = allModules.filter(mod => {
    if (mod.adminOnly && !isAdmin) return false;
    if (isAdmin) return true;
    const rolePermissions = dynamicPermissions[user.role] || [];
    return rolePermissions.includes(mod.id);
  });

  const recordAccessLog = (moduleId: string, moduleTitle: string) => {
    const logs: AccessLog[] = JSON.parse(localStorage.getItem('access_logs_v1') || '[]');
    logs.unshift({
      id: `log-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      module: moduleTitle,
      timestamp: Date.now(),
      action: 'ACCESS_MODULE'
    });
    localStorage.setItem('access_logs_v1', JSON.stringify(logs.slice(0, 100)));
  };

  const handleModuleClick = (module: typeof allModules[0]) => {
    recordAccessLog(module.id, module.title);
    onModuleSelect(module.id as ModuleTypeExtended);
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
    <div className="min-h-screen bg-gray-900 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 fixed"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black fixed opacity-90"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite] fixed"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite] fixed"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* SIDEBAR NAVEGAÇÃO HUB (Glass) */}
        <aside className="fixed left-0 top-0 bottom-0 w-24 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-10 gap-8 no-print z-50">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white font-black border border-white/20">AM</div>

          <nav className="flex-1 flex flex-col gap-4">
            {/* Navegação removida pois agora é tudo em uma tela só */}
          </nav>

          <div className="flex flex-col gap-4">
            {isAdmin && (
              <button
                onClick={() => onModuleSelect('settings')}
                className="p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title="Configurações Gerais"
              >
                <Settings size={24} />
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-4 rounded-2xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Sair do Sistema"
            >
              <LogOut size={24} />
            </button>
          </div>
        </aside>

        <main className="pl-24 flex-1 min-h-screen p-8 lg:p-12 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <WelcomeDashboard
              user={user}
              onModuleSelect={(moduleId) => {
                const module = allowedModules.find(m => m.id === moduleId);
                if (module) handleModuleClick(module);
              }}
              modules={allowedModules}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Hub;
