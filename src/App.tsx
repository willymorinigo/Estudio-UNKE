/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, DesignPiece, PreloadedTask, Budget, Project, BudgetStatus, Payment } from './types';
import { resetToDefaults } from './initialData';
import { subscribeToCollection, saveDocument, deleteDocument, seedDatabaseIfEmpty, forceSeedDatabase } from './firebase';
import Dashboard from './components/Dashboard';
import ClientsList from './components/ClientsList';
import BudgetCreator from './components/BudgetCreator';
import ProjectsList from './components/ProjectsList';
import PiecesManager from './components/PiecesManager';

import { 
  Building2, Users, FileText, FolderGit2, Layers, 
  Menu, X, Sparkles, AlertCircle, LogOut 
} from 'lucide-react';

// @ts-ignore
import fedeAvatar from '@/fede.png';
// @ts-ignore
import nachoAvatar from '@/nacho.png';
// @ts-ignore
import willyAvatar from '@/willy.png';
// @ts-ignore
import logoSvg from '@/logo.svg';

// Resilient Logo Component that automatically fallbacks to 'U' if custom /logo.svg is missing or loading
const Logo = ({ size = 'desktop' }: { size?: 'desktop' | 'mobile' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    if (size === 'desktop') {
      return (
        <span className="w-6 h-6 bg-[#34877c] rounded-lg flex items-center justify-center text-white text-[13px] font-black leading-none shrink-0 select-none">
          U
        </span>
      );
    }
    return (
      <div className="w-8 h-8 bg-[#34877c] rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0 select-none">
        U
      </div>
    );
  }

  return (
    <img 
      src={logoSvg} 
      alt="UNKE" 
      onError={() => setImgFailed(true)}
      className={size === 'desktop' ? "w-6 h-6 object-contain" : "w-8 h-8 object-contain"}
    />
  );
};

export default function App() {
  // Navigation tabs: 'dashboard' | 'clients' | 'budgets' | 'projects' | 'catalog'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'budgets' | 'projects' | 'catalog'>('dashboard');
  const [budgetTabMode, setBudgetTabMode] = useState<'create' | 'history'>('create');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cross-navigation direct linking targets
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const [targetBudgetId, setTargetBudgetId] = useState<string | null>(null);

  const navigateToBudgets = (subTab: 'create' | 'history') => {
    setIsMobileMenuOpen(false);
    setBudgetTabMode(subTab);
    setActiveTab('budgets');
  };

  // Active Partner & Settings
  const [partnerNames, setPartnerNames] = useState<string[]>(() => {
    const stored = localStorage.getItem('unke_partner_names');
    return stored ? JSON.parse(stored) : ['Willy', 'Fede', 'Nacho'];
  });
  
  const [activePartner, setActivePartner] = useState<string>(() => {
    return localStorage.getItem('unke_active_partner') || 'Willy';
  });

  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('unke_current_user') || null;
  });

  const handleLogin = (user: string) => {
    setCurrentUser(user);
    localStorage.setItem('unke_current_user', user);
    setActivePartner(user);
    localStorage.setItem('unke_active_partner', user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('unke_current_user');
  };

  const [isEditingPartners, setIsEditingPartners] = useState(false);

  const handlePartnerChange = (name: string) => {
    setActivePartner(name);
    localStorage.setItem('unke_active_partner', name);
  };

  const handleUpdatePartnerNames = (newNames: string[]) => {
    setPartnerNames(newNames);
    localStorage.setItem('unke_partner_names', JSON.stringify(newNames));
    if (!newNames.includes(activePartner)) {
      setActivePartner(newNames[0] || 'Nuevo Socio');
      localStorage.setItem('unke_active_partner', newNames[0] || 'Nuevo Socio');
    }
  };

  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerInputs, setPartnerInputs] = useState<string[]>(partnerNames);

  const openPartnerModal = () => {
    setPartnerInputs([...partnerNames]);
    setShowPartnerModal(true);
  };

  const savePartnerInputs = () => {
    const valid = partnerInputs.map(p => p.trim()).filter(p => p.length > 0);
    if (valid.length === 0) {
      alert("Por favor ingresa al menos un nombre de socio.");
      return;
    }
    handleUpdatePartnerNames(valid);
    setShowPartnerModal(false);
  };

  // Global Data States
  const [clients, setClients] = useState<Client[]>([]);
  const [pieces, setPieces] = useState<DesignPiece[]>([]);
  const [tasks, setTasks] = useState<PreloadedTask[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load and Subscribe to Firebase
  useEffect(() => {
    // Run seed as isolated background task
    seedDatabaseIfEmpty();

    // Subscribe immediately and synchronously
    const unsubClients = subscribeToCollection<Client>('clients', (items) => {
      setClients(items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    });
    const unsubPieces = subscribeToCollection<DesignPiece>('pieces', (items) => {
      setPieces(items.sort((a, b) => a.name.localeCompare(b.name)));
    });
    const unsubTasks = subscribeToCollection<PreloadedTask>('tasks', (items) => {
      setTasks(items);
    });
    const unsubBudgets = subscribeToCollection<Budget>('budgets', (items) => {
      setBudgets(items.sort((a, b) => b.id.localeCompare(a.id)));
    });
    const unsubProjects = subscribeToCollection<Project>('projects', (items) => {
      setProjects(items.sort((a, b) => b.id.localeCompare(a.id)));
    });

    return () => {
      unsubClients();
      unsubPieces();
      unsubTasks();
      unsubBudgets();
      unsubProjects();
    };
  }, []);

  // Auto-seed if catalog is found empty after subscription loads
  const [hasAutoLoadedCatalog, setHasAutoLoadedCatalog] = useState(false);

  useEffect(() => {
    if (currentUser && !hasAutoLoadedCatalog) {
      const timer = setTimeout(async () => {
        if (pieces.length === 0) {
          console.log("No pieces catalog found in Database. Performing automatic background sync of official catalog...");
          try {
            await forceSeedDatabase();
            setHasAutoLoadedCatalog(true);
          } catch (err) {
            console.error("Failed to auto-seed catalog on startup:", err);
          }
        } else {
          setHasAutoLoadedCatalog(true);
        }
      }, 1000); // 1.0 second delay to allow initial subscription to fetch
      return () => clearTimeout(timer);
    }
  }, [currentUser, pieces.length, hasAutoLoadedCatalog]);

  // Manual trigger to force re-seed/import the entire official catalog to Firestore
  const handleForceSyncCatalog = async () => {
    try {
      await forceSeedDatabase();
    } catch (err) {
      console.error("Error force seeding database:", err);
      throw err;
    }
  };

  // --- 1. Client CRUD handlers (Firebase Powered) ---
  const handleAddClient = async (client: Client) => {
    const enriched = {
      ...client,
      createdBy: activePartner,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    await saveDocument('clients', client.id, enriched);
  };

  const handleUpdateClient = async (updated: Client) => {
    const enriched = {
      ...updated,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    await saveDocument('clients', updated.id, enriched);
  };

  const handleDeleteClient = async (id: string) => {
    await deleteDocument('clients', id);
  };

  // --- 2. Pieces (Products) & Preloaded Tasks Handlers (Firebase Powered) ---
  const handleAddPiece = async (piece: DesignPiece) => {
    const enriched = {
      ...piece,
      createdBy: activePartner,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    await saveDocument('pieces', piece.id, enriched);
  };

  const handleUpdatePiece = async (updated: DesignPiece) => {
    const enriched = {
      ...updated,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    await saveDocument('pieces', updated.id, enriched);
  };

  const handleDeletePiece = async (id: string) => {
    await deleteDocument('pieces', id);
  };

  const handleAddTask = async (task: PreloadedTask) => {
    const enriched = {
      ...task,
      createdBy: activePartner,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    await saveDocument('tasks', task.id, enriched);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteDocument('tasks', id);
  };

  // --- 3. Dynamic Budget handlers (With automatic Project launching on approval!) ---
  const handleAddBudget = async (budget: Budget) => {
    const enriched = {
      ...budget,
      createdBy: activePartner,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    await saveDocument('budgets', budget.id, enriched);
  };

  const handleUpdateBudgetStatus = async (budgetId: string, newStatus: BudgetStatus) => {
    const b = budgets.find(x => x.id === budgetId);
    if (!b) return;
    
    const updatedB: Budget = { 
      ...b, 
      status: newStatus,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    
    await saveDocument('budgets', budgetId, updatedB);
    
    // If status changes to Approved, auto launch project!
    if (newStatus === 'Aprobado') {
      launchProjectFromBudget(updatedB);
    }
  };

  const handleUpdateBudgetFields = async (budgetId: string, updates: Partial<Budget>) => {
    const b = budgets.find(x => x.id === budgetId);
    if (!b) return;
    
    const updatedB: Budget = { 
      ...b, 
      ...updates,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    
    await saveDocument('budgets', budgetId, updatedB);
    
    // If status changes to Approved, auto launch project!
    if (updates.status === 'Aprobado') {
      launchProjectFromBudget(updatedB);
    }
  };

  // Helper: Auto-launch a project with matching pieces and preset task checklists when budget is approved
  const launchProjectFromBudget = async (budget: Budget) => {
    // Check if project already launched for this budget
    const projectExists = projects.some(p => p.budgetId === budget.id);
    if (projectExists) return;

    // Determine task category to pre-load based on design pieces inside the budget
    let targetCategory = 'Identidad';
    const isWeb = budget.items.some(item => 
      item.name.toLowerCase().includes('web') || 
      item.name.toLowerCase().includes('comercio') || 
      item.name.toLowerCase().includes('tienda') || 
      item.name.toLowerCase().includes('page')
    );
    const isMarketing = budget.items.some(item => 
      item.name.toLowerCase().includes('redes') || 
      item.name.toLowerCase().includes('pack') || 
      item.name.toLowerCase().includes('mensual') || 
      item.name.toLowerCase().includes('banner')
    );

    if (isWeb) {
      targetCategory = 'Web';
    } else if (isMarketing) {
      targetCategory = 'Marketing';
    }

    // Capture preloaded tasks matching selected category
    const matchingTasks = tasks
      .filter(t => t.category === targetCategory)
      .map(t => ({
        id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: t.name,
        completed: false
      }));

    // Create the automatically generated project
    const newProject: Project = {
      id: `prj_${Date.now()}`,
      clientId: budget.clientId,
      clientName: budget.clientName.split('(')[0].trim(), // Extract simple client name
      name: `Desarrollo - ${budget.items[0]?.name || 'Diseño Integral'}`,
      description: `Proyecto iniciado de manera automática tras la aprobación técnica del Presupuesto Comercial ${budget.id}. Incluye ${budget.items.length} piezas valoradas.`,
      budgetId: budget.id,
      status: 'En Progreso',
      startDate: new Date().toISOString().split('T')[0],
      tasks: matchingTasks.length > 0 ? matchingTasks : [
        { id: `t_def_1`, name: 'Reunión inicial de kickoff y brief técnico', completed: true },
        { id: `t_def_2`, name: 'Presentación de bocetos preliminares y alternativas', completed: false },
        { id: `t_def_3`, name: 'Ronda de devoluciones y ajustes', completed: false },
        { id: `t_def_4`, name: 'Preparación de ficheros de alta y entrega comercial', completed: false }
      ],
      pieces: budget.items,
      createdBy: 'Sistema ' + activePartner,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString(),
      estimatedDeliveryDate: budget.estimatedDeliveryDate
    };

    await saveDocument('projects', newProject.id, newProject);
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteDocument('budgets', id);
  };

  // --- 4. Payment logging with automatic status update on budgets ---
  const handleAddPayment = async (budgetId: string, payment: Payment) => {
    const b = budgets.find(x => x.id === budgetId);
    if (!b) return;

    const payments = [...b.payments, payment];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    let pStatus: 'Pendiente' | 'Parcial' | 'Completo' = 'Pendiente';
    if (totalPaid >= b.total) {
      pStatus = 'Completo';
    } else if (totalPaid > 0) {
      pStatus = 'Parcial';
    }

    const updated = {
      ...b,
      payments,
      paymentStatus: pStatus,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };

    await saveDocument('budgets', budgetId, updated);
  };

  // --- 5. Project managers ---
  const handleAddProject = async (project: Project) => {
    const enriched = {
      ...project,
      createdBy: activePartner,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    await saveDocument('projects', project.id, enriched);
  };

  const handleUpdateProject = async (updated: Project) => {
    const enriched = {
      ...updated,
      updatedBy: activePartner,
      updatedAt: new Date().toISOString()
    };
    await saveDocument('projects', updated.id, enriched);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteDocument('projects', id);
  };

  // Reset to original demo seed values inside Cloud Database
  const handleReset = async () => {
    if (confirm('¿Restablecer el sistema en la nube con los datos demo de Estudio UNKE? El historial personalizado será borrado para todos los socios.')) {
      try {
        // Log delete operations on all current client-cached records
        for (const c of clients) await deleteDocument('clients', c.id);
        for (const p of pieces) await deleteDocument('pieces', p.id);
        for (const t of tasks) await deleteDocument('tasks', t.id);
        for (const b of budgets) await deleteDocument('budgets', b.id);
        for (const pr of projects) await deleteDocument('projects', pr.id);
        
        // Let firebase listener catch and reset them from fresh feed
        location.reload();
      } catch (err) {
        console.error("Error setting defaults:", err);
      }
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col lg:flex-row font-sans">
      
      {/* Left Sidebar for Desktop Nav */}
      <aside className="hidden lg:flex w-64 bg-[#f8fafb] border-r border-[#6f6f6e]/15 flex-col shrink-0">
        <div className="p-8">
          <div onClick={() => setActiveTab('dashboard')} className="cursor-pointer space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#34877c] flex items-center gap-1.5 leading-none">
              <Logo size="desktop" />
              UNKE
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#6f6f6e] font-semibold">Studio Manager</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
              activeTab === 'dashboard' 
                ? 'bg-[#34877c] text-white shadow-sm shadow-[#34877c]/10' 
                : 'text-[#6f6f6e] hover:bg-gray-100 hover:text-gray-900 text-left'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Panel de Control</span>
          </button>
          
          <button
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
              activeTab === 'clients' 
                ? 'bg-[#34877c] text-white shadow-sm shadow-[#34877c]/10' 
                : 'text-[#6f6f6e] hover:bg-gray-100 hover:text-gray-900 text-left'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Clientes</span>
          </button>

          <button
            onClick={() => navigateToBudgets('create')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
              activeTab === 'budgets' 
                ? 'bg-[#34877c] text-white shadow-sm shadow-[#34877c]/10' 
                : 'text-[#6f6f6e] hover:bg-gray-100 hover:text-gray-900 text-left'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Cotizador & Historial</span>
          </button>

          {activeTab === 'budgets' && (
            <div className="pl-7 pr-2 py-1 space-y-1">
              <button
                onClick={() => setBudgetTabMode('create')}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all border ${
                  budgetTabMode === 'create'
                    ? 'border-emerald-200/50 bg-emerald-50/50 text-emerald-800 font-black'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-semibold'
                }`}
              >
                + Nuevo Presupuesto
              </button>
              <button
                onClick={() => setBudgetTabMode('history')}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all border ${
                  budgetTabMode === 'history'
                    ? 'border-emerald-200/50 bg-emerald-50/50 text-emerald-800 font-black'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-semibold'
                }`}
              >
                📋 Listar Historial PDF
              </button>
            </div>
          )}

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
              activeTab === 'projects' 
                ? 'bg-[#34877c] text-white shadow-sm shadow-[#34877c]/10' 
                : 'text-[#6f6f6e] hover:bg-gray-100 hover:text-gray-900 text-left'
            }`}
          >
            <FolderGit2 className="w-4 h-4 shrink-0" />
            <span>Proyectos</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
              activeTab === 'catalog' 
                ? 'bg-[#34877c] text-white shadow-sm shadow-[#34877c]/10' 
                : 'text-[#6f6f6e] hover:bg-gray-100 hover:text-gray-900 text-left'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Catálogo de Servicios</span>
          </button>
        </nav>

        {/* Info Box bottom sidebar */}
        <div className="p-4 m-4 bg-white border border-[#6f6f6e]/10 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-[#6f6f6e] uppercase mb-1 tracking-wider">Alerta de Pagos</p>
          <p className="text-[11px] text-gray-500 leading-normal">
            Presupuestos con saldos pendientes listos para conciliar en Clientes.
          </p>
        </div>

        {/* Current user session info & logout */}
        <div className="px-4 pb-4 mt-auto space-y-2">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#6f6f6e]/10">
            <UserAvatar user={currentUser || 'Willy'} className="w-8 h-8" />
            <div className="text-left leading-none">
              <span className="text-[9px] font-bold text-[#6f6f6e] uppercase tracking-wider">Socio Activo</span>
              <p className="text-xs font-black text-gray-900 mt-0.5">{currentUser}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between text-[#6f6f6e] hover:text-rose-600 hover:bg-[#ffebee]/10 px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold border border-dashed border-[#6f6f6e]/20 hover:border-rose-200 cursor-pointer"
          >
            <span>Cerrar Sesión</span>
            <LogOut className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main Column Wrapper */}
      <div className="flex-grow flex flex-col min-w-0 bg-[#fafbfc]">
        
        {/* Primary Header Navbar */}
        <header className="bg-white border-b border-[#6f6f6e]/10 sticky top-0 z-50 h-16 lg:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-10">
          
          {/* Brand/Breadcrumb context */}
          <div className="flex items-center gap-3">
            <div className="lg:hidden flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <Logo size="mobile" />
              <h1 className="text-md font-extrabold tracking-tight text-gray-900 leading-none">
                ESTUDIO <span className="text-[#34877c]">UNKE</span>
              </h1>
            </div>
            
            <div className="hidden lg:block">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#6f6f6e] block leading-none mb-1">
                GESTIÓN DE ESTUDIO
              </span>
              <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                {activeTab === 'dashboard' && 'Panel de Control de Operaciones'}
                {activeTab === 'clients' && 'Mapeo y Fichas de Clientes'}
                {activeTab === 'budgets' && 'Cotizador de Servicios & Historial'}
                {activeTab === 'projects' && 'Gestor de Proyectos Activos'}
                {activeTab === 'catalog' && 'Mantenimiento del Catálogo de Servicios'}
              </h2>
            </div>
          </div>

          {/* Actions & Profile (Current Socio Session & Custom Avatar) */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              title="Click para Cerrar Sesión"
              className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#f8fafb] hover:bg-rose-50 border border-[#6f6f6e]/15 hover:border-rose-200 rounded-full transition-all shadow-xs text-left group cursor-pointer"
            >
              <div className="relative">
                <UserAvatar user={currentUser || 'Willy'} className="w-8 h-8 group-hover:opacity-20 transition-opacity" />
                <LogOut className="w-4 h-4 text-rose-600 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-left leading-tight pr-1.5 shrink-0">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-[#6f6f6e] group-hover:text-rose-500 block transition-colors">
                  Socio Colaborando
                </span>
                <span className="text-xs font-black text-gray-900 group-hover:text-rose-700 block transition-colors">
                  {currentUser}
                </span>
              </div>
            </button>

            <button
              onClick={() => navigateToBudgets('history')}
              className="hidden sm:flex bg-slate-100 hover:bg-slate-200 text-gray-700 hover:text-gray-900 text-xs font-bold py-2.5 px-4 rounded-full border border-gray-200 transition-all shadow-xs items-center gap-1.5 cursor-pointer"
              title="Ir al Historial de Presupuestos para revisar o descargar"
            >
              <FileText className="w-3.5 h-3.5 text-[#34877c]" />
              <span>Ver Historial</span>
            </button>

            {/* Mobile menu toggle */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-[#34877c] p-1.5 rounded-lg focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 space-y-1.5 shadow-md sticky top-16 z-40">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold ${
                activeTab === 'dashboard' ? 'bg-[#34877c] text-white' : 'text-gray-600 hover:bg-slate-50'
              }`}
            >
              Panel de Control
            </button>
            <button
              onClick={() => { setActiveTab('clients'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold ${
                activeTab === 'clients' ? 'bg-[#34877c] text-white' : 'text-gray-600 hover:bg-slate-50'
              }`}
            >
              Clientes
            </button>
            <button
              onClick={() => navigateToBudgets('create')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold ${
                activeTab === 'budgets' && budgetTabMode === 'create' ? 'bg-[#34877c] text-white' : 'text-gray-600 hover:bg-slate-50'
              }`}
            >
              Cotizar Servicio Nuevo
            </button>
            <button
              onClick={() => navigateToBudgets('history')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold ${
                activeTab === 'budgets' && budgetTabMode === 'history' ? 'bg-[#34877c] text-white' : 'text-gray-600 hover:bg-slate-50'
              }`}
            >
              Historial de Presupuestos
            </button>
            <button
              onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold ${
                activeTab === 'projects' ? 'bg-[#34877c] text-white' : 'text-gray-600 hover:bg-slate-50'
              }`}
            >
              Proyectos
            </button>
            <button
              onClick={() => { setActiveTab('catalog'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold ${
                activeTab === 'catalog' ? 'bg-[#34877c] text-white' : 'text-gray-600 hover:bg-slate-50'
              }`}
            >
              Catálogo de Servicios
            </button>
            <div className="border-t border-gray-100 my-2 pt-2 space-y-2">
              <div className="flex items-center gap-2 px-3 py-1">
                <UserAvatar user={currentUser || 'Willy'} className="w-7 h-7" />
                <span className="text-xs font-black text-gray-950">{currentUser}</span>
              </div>
              <button
                type="button"
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50/50 flex items-center justify-between transition-all cursor-pointer"
              >
                <span>Cerrar Sesión</span>
                <LogOut className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* Main Stage Panel Area */}
        <main className="flex-grow p-4 sm:p-6 lg:p-10 max-w-[1400px] w-full mx-auto space-y-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              clients={clients}
              budgets={budgets}
              projects={projects}
              onReset={handleReset}
              onNavigate={(tab, subId) => {
                setActiveTab(tab);
                if (tab === 'projects' && subId) {
                  setTargetProjectId(subId);
                } else if (tab === 'budgets' && subId) {
                  setTargetBudgetId(subId);
                  setBudgetTabMode('history');
                }
              }}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsList
              clients={clients}
              budgets={budgets}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onAddPayment={handleAddPayment}
              onNavigateToBudget={(budgetId) => {
                setTargetBudgetId(budgetId);
                setBudgetTabMode('history');
                setActiveTab('budgets');
              }}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetCreator
              clients={clients}
              pieces={pieces}
              budgets={budgets}
              projects={projects}
              onAddBudget={handleAddBudget}
              onUpdateBudgetStatus={handleUpdateBudgetStatus}
              onUpdateBudgetFields={handleUpdateBudgetFields}
              onDeleteBudget={handleDeleteBudget}
              onAddPayment={handleAddPayment}
              onUpdateProject={handleUpdateProject}
              initialTab={budgetTabMode}
              onTabChange={setBudgetTabMode}
              initiallySelectedBudgetId={targetBudgetId}
              onClearInitiallySelectedBudget={() => setTargetBudgetId(null)}
              onNavigateToProject={(projectId) => {
                setTargetProjectId(projectId);
                setActiveTab('projects');
              }}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsList
              projects={projects}
              preloadedTasks={tasks}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              initiallySelectedProjectId={targetProjectId}
              onClearInitiallySelectedProject={() => setTargetProjectId(null)}
              onNavigateToBudget={(budgetId) => {
                setTargetBudgetId(budgetId);
                setBudgetTabMode('history');
                setActiveTab('budgets');
              }}
            />
          )}

          {activeTab === 'catalog' && (
            <PiecesManager
              pieces={pieces}
              tasks={tasks}
              onAddPiece={handleAddPiece}
              onUpdatePiece={handleUpdatePiece}
              onDeletePiece={handleDeletePiece}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onForceSyncCatalog={handleForceSyncCatalog}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-500">
          <p className="font-semibold text-gray-700">Estudio UNKE &copy; 2026. Todos los derechos reservados.</p>
        </footer>

      </div>

      {/* Partner Customization Dialog Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Configurar Socios</h3>
              <p className="text-xs text-gray-500 mt-1">
                Escribe los nombres de los 3 socios que administran el Estudio para firmar vuestros cambios y mantener un historial ordenado.
              </p>
            </div>

            <div className="space-y-3.5">
              {partnerInputs.map((name, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#6f6f6e]">
                    Socio {idx + 1}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const updated = [...partnerInputs];
                      updated[idx] = e.target.value;
                      setPartnerInputs(updated);
                    }}
                    placeholder={`Nombre del Socio ${idx + 1}`}
                    className="w-full text-xs font-semibold px-4 py-3 bg-[#f8fafb] border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#34877c] focus:bg-white text-gray-900 transition-all font-sans"
                  />
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={() => setPartnerInputs([...partnerInputs, ''])}
                className="text-[10px] text-[#34877c] font-black tracking-wider uppercase hover:underline block"
              >
                + Agregar otro socio
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPartnerModal(false)}
                className="flex-1 bg-white hover:bg-slate-50 text-gray-700 text-xs font-bold py-3 px-4 rounded-xl border border-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={savePartnerInputs}
                className="flex-1 bg-[#34877c] hover:bg-[#2c7269] text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-sm shadow-[#34877c]/10"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export function UserAvatar({ user, className = "w-8 h-8" }: { user: string; className?: string }) {
  const normUser = (user || '').trim().toLowerCase();
  let src = willyAvatar;
  let label = "W";
  if (normUser.includes('fede')) {
    src = fedeAvatar;
    label = "F";
  } else if (normUser.includes('nacho')) {
    src = nachoAvatar;
    label = "N";
  }

  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className} bg-[#34877c]/10 text-[#34877c] rounded-full flex items-center justify-center font-black text-xs select-none shrink-0 border border-[#34877c]/25`}>
        {label}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 rounded-full border border-[#34877c]/20 overflow-hidden bg-white ${className}`}>
      <img 
        src={src} 
        alt={user} 
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

function Login({ onLogin }: { onLogin: (user: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const creds: Record<string, string> = {
      Fede: 'unkefede',
      Nacho: 'unkenacho',
      Willy: 'unkewilly'
    };

    // Case-insensitive check
    const userKey = Object.keys(creds).find(
      key => key.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (userKey && creds[userKey] === password) {
      onLogin(userKey);
    } else {
      setError('Credenciales incorrectas. Verifique el usuario y la contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-sm bg-white border border-[#6f6f6e]/15 rounded-3xl shadow-xl p-8 space-y-6 relative overflow-hidden">
        
        {/* Aesthetic background accent */}
        <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/3 -translate-y-1/3 pointer-events-none select-none">
          <Building2 className="w-48 h-48 text-[#34877c]" />
        </div>

        <div className="text-center space-y-2 relative">
          <div className="flex justify-center mb-1">
            <Logo size="mobile" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            ESTUDIO <span className="text-[#34877c]">UNKE</span>
          </h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#6f6f6e]">
            Studio Manager • Acceso de Socios
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-2xl p-3.5 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <p className="leading-snug font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#6f6f6e] uppercase tracking-wider">
              Usuario de Socio
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Fede, Nacho, Willy"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              className="w-full bg-white border border-[#6f6f6e]/20 rounded-2xl px-4 py-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#34877c] focus:ring-1 focus:ring-[#34877c] font-semibold transition-all shadow-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#6f6f6e] uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-white border border-[#6f6f6e]/20 rounded-2xl px-4 py-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#34877c] focus:ring-1 focus:ring-[#34877c] font-semibold transition-all shadow-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#34877c] hover:bg-[#2c7269] text-white text-xs font-bold py-3.5 rounded-2xl transition-all shadow-md active:scale-[0.98]"
          >
            Ingresar al Sistema
          </button>
        </form>

        <div className="border-t border-gray-150/60 pt-5 text-center">
          <p className="text-[10px] text-[#6f6f6e] font-semibold leading-normal mb-3">
            Socios Habilitados:
          </p>
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <UserAvatar user="Fede" className="w-10 h-10" />
              <span className="text-[10px] font-bold text-gray-850">Fede</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <UserAvatar user="Nacho" className="w-10 h-10" />
              <span className="text-[10px] font-bold text-gray-850">Nacho</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <UserAvatar user="Willy" className="w-10 h-10" />
              <span className="text-[10px] font-bold text-gray-850">Willy</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

