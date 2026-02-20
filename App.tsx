import React, { useState, useEffect, Suspense, useTransition, useCallback } from 'react';
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

export type ModuleTypeExtended = 'hub' | 'merenda' | 'finance' | 'library' | 'scheduling' | 'teacher' | 'pedagogical' | 'almoxarifado' | 'patrimonio' | 'limpeza' | 'busca_ativa' | 'psychosocial' | 'secretariat' | 'special_education' | 'settings';

const App: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('active_session_v1');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing session:", e);
      return null;
    }
  });

  const [activeModule, setActiveModule] = useState<ModuleTypeExtended>(() => {
    try {
      const saved = localStorage.getItem('active_portal_module');
      return (saved as ModuleTypeExtended) || 'hub';
    } catch (e) {
      return 'hub';
    }
  });

  const INACTIVITY_LIMIT = 15 * 60 * 1000;
  const logout = useCallback(() => {
    localStorage.removeItem('active_session_v1');
    setUser(null);
    setActiveModule('hub');
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
      <ToastProvider>
        <Login onLogin={handleLogin} />
      </ToastProvider>
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
  );
};

export default App;
