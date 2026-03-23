import React, { useState, useEffect, Suspense, useTransition, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import MerendaModule from './modules/MerendaModule';
import FinanceModule from './modules/FinanceModule';
import LibraryModule from './modules/LibraryModule';
import SchedulingModule from './modules/SchedulingModule';
import TeacherModule from './modules/TeacherModule';
import PedagogicalModule from './modules/PedagogicalModule';
import AlmoxarifeModule from './modules/AlmoxarifeModule';
import AssetInventoryModule from './modules/AssetInventoryModule';
import CleaningMaintenanceModule from './modules/CleaningMaintenanceModule';
import BuscaAtivaModule from './modules/BuscaAtivaModule';
import PsychosocialModule from './modules/PsychosocialModule';
import SecretariatModule from './modules/SecretariatModule';
import SpecialEducationModule from './modules/SpecialEducationModule';
import Settings from './components/Settings';
import Hub from './components/Hub';
import Login from './components/Login';
import { User } from './types';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { ToastProvider } from './components/Toast';
import { INITIAL_STUDENTS } from './constants/initialData';

export type ModuleTypeExtended = 'hub' | 'merenda' | 'finance' | 'library' | 'scheduling' | 'teacher' | 'pedagogical' | 'almoxarifado' | 'patrimonio' | 'limpeza' | 'busca_ativa' | 'psychosocial' | 'secretariat' | 'special_education' | 'settings';

const App: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<User | null>(() => {
    try {
      // SANEAMENTO DE LEGADO: Limpar chaves antigas que podem causar crash
      const legacyKeys = ['active_session', 'access_logs', 'school_announcements', 'portal_module_permissions'];
      legacyKeys.forEach(key => {
        if (localStorage.getItem(key)) localStorage.removeItem(key);
      });

      const saved = localStorage.getItem('active_session_v1');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Validação rigorosa de integridade da sessão
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
        return parsed;
      }
      localStorage.removeItem('active_session_v1'); // Limpar se estiver inválido
      return null;
    } catch (e) {
      console.error("Error parsing session:", e);
      localStorage.removeItem('active_session_v1');
      return null;
    }
  });

  const [activeModule, setActiveModule] = useState<ModuleTypeExtended>(() => {
    try {
      const saved = localStorage.getItem('active_portal_module');
      const validModules: ModuleTypeExtended[] = [
        'hub', 'merenda', 'finance', 'library', 'scheduling', 'teacher',
        'pedagogical', 'almoxarifado', 'patrimonio', 'limpeza',
        'busca_ativa', 'psychosocial', 'secretariat', 'special_education', 'settings'
      ];
      if (validModules.includes(saved as ModuleTypeExtended)) {
        return saved as ModuleTypeExtended;
      }
      return 'hub';
    } catch (e) {
      return 'hub';
    }
  });

  // Aumentado o limite de inatividade para 12 horas a pedido do usuário
  const INACTIVITY_LIMIT = 12 * 60 * 60 * 1000;
  const logout = useCallback(() => {
    localStorage.removeItem('active_session_v1');
    setActiveModule('hub');
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user) return;

    let timeout: number;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(logout, INACTIVITY_LIMIT);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearTimeout(timeout);
    };
  }, [user, logout]);

  useEffect(() => {
    localStorage.setItem('active_portal_module', activeModule);
  }, [activeModule]);

  // Sincronização forçada dos alunos de algumas turmas (6º ANO A, B, D, E e 7º ANO A, B, D, E) no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('secretariat_detailed_students_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remover os antigos
          const filtered = parsed.filter(s => s.Turma !== '6º ANO A' && s.Turma !== '6º ANO B' && s.Turma !== '6º ANO D' && s.Turma !== '6º ANO E' && s.Turma !== '7º ANO A' && s.Turma !== '7º ANO B' && s.Turma !== '7º ANO D' && s.Turma !== '7º ANO E');
          
          // Novos alunos
          const novos6A = INITIAL_STUDENTS.filter(s => s.Turma === '6º ANO A');
          const novos6B = INITIAL_STUDENTS.filter(s => s.Turma === '6º ANO B');
          const novos6D = INITIAL_STUDENTS.filter(s => s.Turma === '6º ANO D');
          const novos6E = INITIAL_STUDENTS.filter(s => s.Turma === '6º ANO E');
          const novos7A = INITIAL_STUDENTS.filter(s => s.Turma === '7º ANO A');
          const novos7B = INITIAL_STUDENTS.filter(s => s.Turma === '7º ANO B');
          const novos7D = INITIAL_STUDENTS.filter(s => s.Turma === '7º ANO D');
          const novos7E = INITIAL_STUDENTS.filter(s => s.Turma === '7º ANO E');
          
          const current6A = parsed.filter(s => s.Turma === '6º ANO A');
          const current6B = parsed.filter(s => s.Turma === '6º ANO B');
          const current6D = parsed.filter(s => s.Turma === '6º ANO D');
          const current6E = parsed.filter(s => s.Turma === '6º ANO E');
          const current7A = parsed.filter(s => s.Turma === '7º ANO A');
          const current7B = parsed.filter(s => s.Turma === '7º ANO B');
          const current7D = parsed.filter(s => s.Turma === '7º ANO D');
          const current7E = parsed.filter(s => s.Turma === '7º ANO E');
          
          // Verifica se precisa atualizar
          const checkUpdate = (current: any[], novos: any[]) => current.length !== novos.length || current.some((c, i) => !novos.find(n => n.CodigoAluno === c.CodigoAluno || n.Nome !== c.Nome));
          
          const needsUpdateA = checkUpdate(current6A, novos6A);
          const needsUpdateB = checkUpdate(current6B, novos6B);
          const needsUpdateD = checkUpdate(current6D, novos6D);
          const needsUpdateE = checkUpdate(current6E, novos6E);
          const needsUpdate7A = checkUpdate(current7A, novos7A);
          const needsUpdate7B = checkUpdate(current7B, novos7B);
          const needsUpdate7D = checkUpdate(current7D, novos7D);
          const needsUpdate7E = checkUpdate(current7E, novos7E);
          
          if (needsUpdateA || needsUpdateB || needsUpdateD || needsUpdateE || needsUpdate7A || needsUpdate7B || needsUpdate7D || needsUpdate7E) {
            const updated = [...filtered, ...novos6A, ...novos6B, ...novos6D, ...novos6E, ...novos7A, ...novos7B, ...novos7D, ...novos7E];
            localStorage.setItem('secretariat_detailed_students_v1', JSON.stringify(updated));
            console.log("Alunos sincronizados com sucesso no localStorage.");
          }
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar alunos:", e);
    }
  }, []);

  const handleLogin = (loggedUser: User) => {
    localStorage.setItem('active_session_v1', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  const handleUserUpdate = (updatedUser: User) => {
    localStorage.setItem('active_session_v1', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const handleModuleChange = (module: ModuleTypeExtended) => {
    startTransition(() => {
      setActiveModule(module);
    });
  };

  if (!user) {
    return (
      <ErrorBoundary>
        <ToastProvider>
          <Login onLogin={handleLogin} />
        </ToastProvider>
      </ErrorBoundary>
    );
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'hub': return <Hub user={user} onLogout={logout} onModuleSelect={handleModuleChange} onUserUpdate={handleUserUpdate} />;
      case 'merenda': return <MerendaModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'finance': return <FinanceModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'library': return <LibraryModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'scheduling': return <SchedulingModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'teacher': return <TeacherModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'pedagogical': return <PedagogicalModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'almoxarifado': return <AlmoxarifeModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'patrimonio': return <AssetInventoryModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'limpeza': return <CleaningMaintenanceModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'busca_ativa': return <BuscaAtivaModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'psychosocial': return <PsychosocialModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'secretariat': return <SecretariatModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'special_education': return <SpecialEducationModule user={user} onExit={() => handleModuleChange('hub')} />;
      case 'settings': return (
        <div className="min-h-screen bg-gray-50 p-8 lg:p-12">
          <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={() => handleModuleChange('hub')} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-indigo-600 shadow-sm transition-all"><ArrowLeft size={24} /></button>
                <div>
                  <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Painel de Controle do Sistema</h1>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Gestão de Permissões e Segurança</p>
                </div>
              </div>
              <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl"><SettingsIcon size={32} /></div>
            </header>
            <Settings />
          </div>
        </div>
      );
      default: return <Hub user={user} onLogout={logout} onModuleSelect={handleModuleChange} />;
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Iniciando Portal...</p>
          </div>
        </div>
      }>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50">
            {renderActiveModule()}
          </div>
        </ToastProvider>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
