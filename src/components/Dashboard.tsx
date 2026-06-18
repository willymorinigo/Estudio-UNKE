/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Client, Budget, Project } from '../types';
import { formatCurrency, formatDateDMY } from '../pdfExport';
import { 
  Building2, Users, FileText, FolderGit2, DollarSign, 
  TrendingUp, PiggyBank, Clock, ClipboardList, RefreshCw, Star, Calendar 
} from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  budgets: Budget[];
  projects: Project[];
  onReset: () => void;
  onNavigate: (tab: 'clients' | 'budgets' | 'projects', subId?: string) => void;
}

export default function Dashboard({
  clients,
  budgets,
  projects,
  onReset,
  onNavigate
}: DashboardProps) {
  // Financial metrics
  // Include commercially approved budgets as well as any other budget that has recorded payments (e.g. initiated with partial payment)
  const approvedBudgets = budgets.filter(b => b.status === 'Aprobado' || (b.payments && b.payments.length > 0));
  const totalBudgeted = approvedBudgets.reduce((sum, b) => sum + b.total, 0);
  
  const totalCollected = approvedBudgets.reduce((sum, b) => {
    const pList = b.payments || [];
    return sum + pList.reduce((pSum, p) => pSum + p.amount, 0);
  }, 0);

  const pendingCollection = totalBudgeted - totalCollected;

  // Active projects count
  const activeProjects = projects.filter(p => p.status === 'En Progreso' || p.status === 'En Revision');
  const completedProjectsCount = projects.filter(p => p.status === 'Completado').length;

  // Percentage accounts collected
  const recoveryRate = totalBudgeted > 0 
    ? Math.round((totalCollected / totalBudgeted) * 100) 
    : 0;

  // 1. Deliveries countdown logic
  const projectsWithDelivery = projects
    .filter(p => p.status !== 'Completado' && p.estimatedDeliveryDate)
    .map(p => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const deliveryDate = new Date(p.estimatedDeliveryDate! + 'T00:00:00');
      const diffTime = deliveryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...p,
        daysRemaining: diffDays
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // 2. Billing alerts and abonos logic for maintenance tasks and monthly budgets
  const todayDay = new Date().getDate();

  // Find all monthly budgets (isMonthly === true)
  const monthlyBudgets = budgets.filter(b => b.isMonthly === true);

  // Find all project tasks that are maintenance
  const projectMaintTasks = projects.flatMap(p => 
    (p.tasks || [])
      .filter(t => t.isMaintenance)
      .map(t => {
        const billingDay = t.monthlyBillingDay;
        let alertStatus: 'due_today' | 'upcoming' | 'recent_past' | 'none' = 'none';
        let alertMessage = '';
        
        if (billingDay) {
          const diff = billingDay - todayDay;
          if (diff === 0) {
            alertStatus = 'due_today';
            alertMessage = `¡Se cobra HOY! (Día ${billingDay})`;
          } else if (diff > 0 && diff <= 4) {
            alertStatus = 'upcoming';
            alertMessage = `Próximo: en ${diff} días`;
          } else if (diff < 0 && diff >= -3) {
            alertStatus = 'recent_past';
            alertMessage = `Hace ${Math.abs(diff)} días (Día ${billingDay})`;
          }
        }

        return {
          id: `task_${p.id}_${t.id}`,
          name: t.name,
          clientName: p.clientName,
          amount: t.monthlyBillingAmount || 0,
          billingDay,
          status: 'Activo' as const,
          itemType: 'task' as const,
          targetId: p.id,
          alertStatus,
          alertMessage
        };
      })
  );

  // Map monthly budgets to unified items
  const monthlyBudgetItems = monthlyBudgets.map(b => {
    let statusLabel: 'Activo' | 'Borrador' | 'Pte. Aprobación' = 'Pte. Aprobación';
    if (b.status === 'Aprobado') {
      statusLabel = 'Activo';
    } else if (b.status === 'Borrador') {
      statusLabel = 'Borrador';
    } else if (b.status === 'Enviado') {
      statusLabel = 'Pte. Aprobación';
    }

    return {
      id: `budget_${b.id}`,
      name: `Abono Mensual (${b.id})`,
      clientName: b.clientName,
      amount: b.total,
      billingDay: undefined,
      status: statusLabel,
      itemType: 'budget' as const,
      targetId: b.id,
      alertStatus: 'none' as const,
      alertMessage: ''
    };
  });

  // Combine both sources
  const combinedAbonos = [...projectMaintTasks, ...monthlyBudgetItems];

  // Count active ones: those tasks in live projects and approved monthly budgets + any task
  const activeAbonosCount = combinedAbonos.filter(item => item.status === 'Activo').length;

  const draftAbonos = combinedAbonos.filter(item => item.status === 'Borrador');
  const pendingAbonos = combinedAbonos.filter(item => item.status === 'Pte. Aprobación');
  const activeAbonos = combinedAbonos.filter(item => item.status === 'Activo');

  const draftCount = draftAbonos.length;
  const pendingCount = pendingAbonos.length;
  const activeCount = activeAbonos.length;

  const totalDraftAmount = draftAbonos.reduce((sum, item) => sum + item.amount, 0);
  const totalPendingAmount = pendingAbonos.reduce((sum, item) => sum + item.amount, 0);
  const totalActiveAmount = activeAbonos.reduce((sum, item) => sum + item.amount, 0);

  // Standard budgets calculations (Ordinary, non-recurring budgets)
  const standardBudgets = budgets.filter(b => b.isMonthly !== true);

  const draftStdBudgets = standardBudgets.filter(b => b.status === 'Borrador');
  const pendingStdBudgets = standardBudgets.filter(b => b.status === 'Enviado');
  const approvedStdBudgetsWithBalance = standardBudgets.filter(b => {
    if (b.status !== 'Aprobado') return false;
    const collected = (b.payments || []).reduce((sum, p) => sum + p.amount, 0);
    return (b.total - collected) > 0;
  });

  const draftStdCount = draftStdBudgets.length;
  const pendingStdCount = pendingStdBudgets.length;
  const approvedStdCount = approvedStdBudgetsWithBalance.length;

  const totalDraftStdAmount = draftStdBudgets.reduce((sum, b) => sum + b.total, 0);
  const totalPendingStdAmount = pendingStdBudgets.reduce((sum, b) => sum + b.total, 0);
  const totalApprovedPendingBalance = approvedStdBudgetsWithBalance.reduce((sum, b) => {
    const collected = (b.payments || []).reduce((sum, p) => sum + p.amount, 0);
    return sum + (b.total - collected);
  }, 0);

  // Sorting
  const sortedAbonos = [...combinedAbonos].sort((a, b) => {
    // 1. Critical alerts first
    const getAlertPriority = (status: string) => {
      if (status === 'due_today') return 0;
      if (status === 'recent_past') return 1;
      if (status === 'upcoming') return 2;
      return 3;
    };
    const prioA = getAlertPriority(a.alertStatus);
    const prioB = getAlertPriority(b.alertStatus);
    if (prioA !== prioB) return prioA - prioB;

    // 2. Status priority
    const getStatusPriority = (status: string) => {
      if (status === 'Activo') return 0;
      if (status === 'Pte. Aprobación') return 1;
      if (status === 'Borrador') return 2;
      return 3;
    };
    const statusPrioA = getStatusPriority(a.status);
    const statusPrioB = getStatusPriority(b.status);
    if (statusPrioA !== statusPrioB) return statusPrioA - statusPrioB;

    // 3. Fallback to client name
    return a.clientName.localeCompare(b.clientName);
  });


  return (
    <div className="space-y-6" id="unke-dashboard">
      
      {/* SECCIÓN SUPERIOR: BIENVENIDA Y PRÓXIMAS ENTREGAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
        
        {/* Welcome Banner */}
        <div className="lg:col-span-2 bg-[#f8fafb] border border-[#6f6f6e]/15 text-gray-900 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-6 select-none shrink-0 pointer-events-none">
            <Building2 className="w-64 h-64 text-[#34877c]" />
          </div>
          <div className="relative z-10 space-y-3.5">
            <span className="text-[9px] bg-[#34877c]/10 text-[#34877c] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">
              ESTUDIO UNKE • CONTROL INTEGRAL
            </span>
            <h2 className="text-3xl font-extrabold font-sans tracking-tight leading-none text-gray-950">
              Seguimiento de proyectos
            </h2>
            <p className="text-xs text-slate-600 leading-normal font-medium max-w-xl">
              Hola, willymorinigo. Bienvenido al panel de UNKE. Administra tus cotizaciones en pesos argentinos con cálculo automático e integración de checklists de tareas tras la aprobación de presupuestos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-4 relative z-10">
            <button
              onClick={() => onNavigate('budgets')}
              className="bg-[#34877c] hover:bg-[#2c7269] text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Armar Presupuesto</span>
            </button>
            <button
              onClick={() => onNavigate('clients')}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold py-2.5 px-5 rounded-full shadow-sm hover:scale-[1.02] flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#34877c]" />
              <span>Cargar Cliente</span>
            </button>
            <button
              onClick={() => onNavigate('projects')}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold py-2.5 px-5 rounded-full shadow-sm hover:scale-[1.02] flex items-center gap-2 transition-all cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-[#34877c]" />
              <span>Control de Checklists</span>
            </button>
          </div>
        </div>

        {/* ENTREGA DE PROYECTOS / CUENTA REGRESIVA */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-rose-150/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 border-b border-rose-100 pb-2">
              <Clock className="w-4 h-4 text-rose-500 shrink-0" />
              Vencimientos de Entrega Próxima ({projectsWithDelivery.length})
            </h4>
            {projectsWithDelivery.length > 0 ? (
              <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                {projectsWithDelivery.map(p => {
                  let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-100";
                  let textDays = "";
                  
                  if (p.daysRemaining < 0) {
                    badgeColor = "bg-rose-50 text-rose-800 border-rose-200 animate-pulse font-black";
                    textDays = `⚠️ Retrasado por ${Math.abs(p.daysRemaining)} días`;
                  } else if (p.daysRemaining === 0) {
                    badgeColor = "bg-amber-100 text-amber-800 border-amber-200 animate-pulse font-black";
                    textDays = `🔥 ¡Entregar HOY!`;
                  } else if (p.daysRemaining === 1) {
                    badgeColor = "bg-amber-50 text-amber-800 border-amber-150 font-bold";
                    textDays = `📅 Mañana (1 día)`;
                  } else {
                    badgeColor = "bg-purple-50 text-purple-800 border-purple-100 font-semibold";
                    textDays = `En ${p.daysRemaining} días (${formatDateDMY(p.estimatedDeliveryDate)})`;
                  }

                  return (
                    <div 
                      key={p.id}
                      className="p-2.5 px-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition gap-4 cursor-pointer"
                      onClick={() => onNavigate('projects', p.id)}
                      title="Haz clic para ver el proyecto en la sección de checklists"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-extrabold text-[11px] text-gray-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-450 font-bold">{p.clientName}</p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-lg border shrink-0 text-center font-mono ${badgeColor}`}>
                        {textDays}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-1.5 flex-1 flex flex-col justify-center">
                <Calendar className="w-5 h-5 text-gray-300 mx-auto" />
                <p className="text-[11px] font-bold text-gray-750">No hay entregas asignadas</p>
                <p className="text-[9px] text-gray-400 max-w-[280px] mx-auto leading-normal">
                  Estipula una **Fecha Tentativa de Entrega** al crear un presupuesto o editando la carpeta del proyecto.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SECCIÓN DE ALERTAS OPERATIVAS Y COBROS DE MANTENIMIENTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300" id="alerts-grid">
        
        {/* ALERTAS DE COBRO DE MANTENIMIENTO */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
            <Star className="w-4 h-4 text-emerald-600 shrink-0" />
            Mantenimiento y Cobro de Abonos ({activeAbonosCount} Activos)
          </h4>
          
          {sortedAbonos.length > 0 ? (
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {sortedAbonos.some(item => item.alertStatus !== 'none') && (
                <p className="text-[9px] uppercase font-extrabold tracking-wider text-rose-500 font-sans mb-1.5">⚠️ Pagos con Vencimientos Activos:</p>
              )}
              {sortedAbonos.map((item) => {
                let cardBorder = "border-slate-100";
                let statusBadge = null;

                if (item.alertStatus === 'due_today') {
                  cardBorder = "border-emerald-355 bg-emerald-50/20";
                  statusBadge = (
                    <span className="text-[9px] px-2 py-0.5 rounded-lg border font-black animate-pulse bg-emerald-150 text-emerald-950 border-emerald-355">
                      {item.alertMessage}
                    </span>
                  );
                } else if (item.alertStatus === 'recent_past') {
                  cardBorder = "border-amber-255 bg-amber-50/10";
                  statusBadge = (
                    <span className="text-[9px] px-2 py-0.5 rounded-lg border font-bold bg-amber-100 text-amber-900 border-amber-255">
                      {item.alertMessage}
                    </span>
                  );
                } else if (item.alertStatus === 'upcoming') {
                  cardBorder = "border-emerald-155 bg-emerald-50/10";
                  statusBadge = (
                    <span className="text-[9px] px-2 py-0.5 rounded-lg border font-black bg-emerald-50 text-emerald-850 border-emerald-155">
                      {item.alertMessage}
                    </span>
                  );
                } else {
                  if (item.status === 'Activo') {
                    statusBadge = (
                      <span className="text-[9px] px-2 py-0.5 rounded-lg border font-extrabold bg-emerald-50 text-emerald-800 border-emerald-150 uppercase">
                        ⚙️ Activo {item.billingDay ? `(Día ${item.billingDay})` : ''}
                      </span>
                    );
                  } else if (item.status === 'Pte. Aprobación') {
                    statusBadge = (
                      <span className="text-[9px] px-2 py-0.5 rounded-lg border font-bold bg-amber-50 text-amber-800 border-amber-200 uppercase">
                        ⏳ Pte. Aprobación
                      </span>
                    );
                  } else if (item.status === 'Borrador') {
                    statusBadge = (
                      <span className="text-[9px] px-2 py-0.5 rounded-lg border font-bold bg-slate-100 text-slate-700 border-slate-200 uppercase">
                        📝 Borrador
                      </span>
                    );
                  }
                }

                return (
                  <div 
                    key={item.id}
                    className={`p-2.5 px-3 bg-white hover:bg-slate-50 rounded-xl border flex items-center justify-between transition gap-4 cursor-pointer ${cardBorder}`}
                    onClick={() => {
                      if (item.itemType === 'budget') {
                        onNavigate('budgets', item.targetId);
                      } else {
                        onNavigate('projects', item.targetId);
                      }
                    }}
                    title={item.itemType === 'budget' ? "Ver este presupuesto de abono en detalle" : "Ver detalles de mantenimiento en el proyecto"}
                  >
                    <div className="space-y-0.5 min-w-0 text-left">
                      <p className="font-extrabold text-[11px] text-gray-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-450 font-bold truncate">Cliente: {item.clientName}</p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                      {statusBadge}
                      {item.amount > 0 && (
                        <span className="text-[10px] font-mono font-black text-emerald-600">
                          {formatCurrency(item.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-7 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-1.5">
              <RefreshCw className="w-5 h-5 text-gray-300 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
              <p className="text-[11px] font-bold text-gray-750">No hay abonos de mantenimiento</p>
              <p className="text-[9px] text-gray-400 max-w-[280px] mx-auto">
                Para fidelizar servicios mensuales (e.g. hosting, mantenimiento web), marca la opción **Abono Mensual** al crear presupuestos o activa el **botón de reloj 🔄** en tus proyectos.
              </p>
            </div>
          )}
        </div>

        {/* PRESUPUESTOS EN BORRADOR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
              Presupuestos en Borrador ({draftStdCount})
            </span>
            {draftStdCount > 0 && (
              <span className="text-[9.5px] font-mono font-black text-slate-600 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg leading-none">
                Suma: {formatCurrency(totalDraftStdAmount)}
              </span>
            )}
          </h4>
          
          {draftStdCount > 0 ? (
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {draftStdBudgets.map((b) => (
                <div 
                  key={b.id}
                  className="p-2.5 px-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition gap-4 cursor-pointer"
                  onClick={() => onNavigate('budgets', b.id)}
                  title="Haz clic para ver y editar este presupuesto en borrador"
                >
                  <div className="space-y-0.5 min-w-0 text-left">
                    <p className="font-extrabold text-[11.5px] text-gray-800 truncate">{b.clientName}</p>
                    <p className="text-[9.5px] text-gray-450 font-bold truncate">Código: {b.id}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded border font-black bg-slate-100 text-slate-700 border-slate-200 uppercase leading-none">
                      📝 Borrador
                    </span>
                    <span className="text-[11px] font-mono font-black text-slate-600">
                      {formatCurrency(b.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-1.5">
              <FileText className="w-5 h-5 text-gray-300 mx-auto" />
              <p className="text-[11px] font-bold text-gray-750">No hay presupuestos en borrador</p>
              <p className="text-[9px] text-gray-400 max-w-[280px] mx-auto leading-normal">
                Todas tus cotizaciones fijas y desarrollos de Estudio UNKE están aprobados o enviados formalmente al cliente.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* METRICS Bento Grid (ARS pesos values displayed precisely) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Budgets volume */}
        <div className="bg-white p-6 rounded-2xl border border-[#6f6f6e]/15 shadow-sm flex items-center gap-4 transition hover:border-[#34877c]/30">
          <div className="p-3 bg-[#34877c]/10 text-[#34877c] rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6f6f6e] block tracking-wider">Actividad Presupuestada</span>
            <span className="text-xl font-extrabold text-gray-900 font-mono mt-0.5">{formatCurrency(totalBudgeted)}</span>
            <p className="text-[10px] text-[#34877c] font-semibold mt-0.5">{approvedBudgets.length} presupuestos activos/aprobados</p>
          </div>
        </div>

        {/* KPI 2: Recaudado */}
        <div className="bg-white p-6 rounded-2xl border border-[#6f6f6e]/15 shadow-sm flex items-center gap-4 transition hover:border-[#34877c]/30">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6f6f6e] block tracking-wider">Montos Recaudados</span>
            <span className="text-xl font-extrabold text-emerald-850 font-mono mt-0.5">{formatCurrency(totalCollected)}</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{recoveryRate}% colectado de la cartera</p>
          </div>
        </div>

        {/* KPI 3: Pendientes */}
        <div className="bg-white p-6 rounded-2xl border border-[#6f6f6e]/15 shadow-sm flex items-center gap-4 transition hover:border-amber-400/30">
          <div className="p-3 bg-amber-50/70 text-amber-700 rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6f6f6e] block tracking-wider">Saldos Pendientes</span>
            <span className="text-xl font-extrabold text-amber-700 font-mono mt-0.5">{formatCurrency(pendingCollection)}</span>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">Sujeto a facturación de entregas</p>
          </div>
        </div>

        {/* KPI 4: Projects */}
        <div className="bg-white p-6 rounded-2xl border border-[#6f6f6e]/15 shadow-sm flex items-center gap-4 transition hover:border-[#34877c]/30">
          <div className="p-3 bg-slate-50 text-slate-700 rounded-xl shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6f6f6e] block tracking-wider">Desarrollos Activos</span>
            <span className="text-xl font-extrabold text-slate-950 mt-0.5">{activeProjects.length} Proyectos</span>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{completedProjectsCount} finalizados con éxito</p>
          </div>
        </div>

      </div>

      {/* Visual Analytics Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3: Graphical Progress Metrics & Core budget status tracker */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Trabajos & Proyectos en Curso */}
          <div className="bg-white p-6 rounded-2xl border border-[#6f6f6e]/15 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 leading-snug">Trabajos & Proyectos en Curso</h3>
                <p className="text-xs text-gray-500">Listado de desarrollos y checklists activos del equipo.</p>
              </div>
              <button
                onClick={() => onNavigate('projects')}
                className="text-[#34877c] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                Ir a Proyectos &rarr;
              </button>
            </div>

            {activeProjects.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-gray-400 italic text-xs">
                No hay proyectos en curso asignados en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProjects.slice(0, 4).map(proj => {
                  const totalT = proj.tasks.length;
                  const completedT = proj.tasks.filter(t => t.completed).length;
                  const pct = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;
                  const nextTask = proj.tasks.find(t => !t.completed);

                  return (
                    <div key={proj.id} className="p-4 bg-[#f8fafb] rounded-xl border border-[#6f6f6e]/10 flex flex-col justify-between space-y-3 hover:border-[#34877c]/30 transition group">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-gray-900 group-hover:text-[#34877c] transition text-xs line-clamp-1">
                            {proj.name}
                          </h4>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            proj.status === 'En Progreso' 
                              ? 'bg-[#34877c]/10 text-[#34877c] border border-[#34877c]/20'
                              : proj.status === 'En Revision'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}>
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-semibold truncate">Cliente: {proj.clientName}</p>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-gray-500">
                          <span>Progreso</span>
                          <span>{completedT}/{totalT} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-250 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#34877c] h-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Immediate next task */}
                      {nextTask ? (
                        <div className="bg-white border border-[#6f6f6e]/10 p-2 rounded text-[10px] leading-tight flex items-start gap-1">
                          <span className="text-[#34877c] font-black shrink-0">→</span>
                          <span className="text-gray-650" title={nextTask.name}>
                            <strong>Siguiente:</strong> <span className="line-clamp-1 text-gray-600 inline">{nextTask.name}</span>
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-600 font-bold italic">
                          ✓ checklist completado
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom SVG Accounts Collection Progress widget */}
          <div className="bg-white p-6 rounded-2xl border border-[#6f6f6e]/15 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 leading-snug">Rendimiento de Cobros & Finanzas</h3>
              <p className="text-xs text-gray-500">Distribución de fondos aprobados totales ({formatCurrency(totalBudgeted)}).</p>
            </div>

            {/* Micro bar diagram designed as custom graphic */}
            <div className="space-y-3 pt-2">
              <div className="flex h-5 w-full bg-slate-100 rounded-full overflow-hidden font-mono text-[9px] font-bold text-white shrink-0">
                {totalCollected > 0 && (
                  <div 
                    className="bg-[#34877c] flex items-center justify-center transition-all duration-700"
                    style={{ width: `${recoveryRate}%` }}
                    title={`Recaudado: ${formatCurrency(totalCollected)}`}
                  >
                    <span>{recoveryRate}% COBRADO</span>
                  </div>
                )}
                {pendingCollection > 0 && (
                  <div 
                    className="bg-amber-150 flex items-center justify-center text-amber-900 bg-amber-200 transition-all duration-700"
                    style={{ width: `${100 - recoveryRate}%` }}
                    title={`Pendiente: ${formatCurrency(pendingCollection)}`}
                  >
                    <span>{100 - recoveryRate}% SALDO PENDIENTE</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#6f6f6e] px-1 font-mono">
                <span>Ingresos Reales: {formatCurrency(totalCollected)}</span>
                <span>Pendiente Total: {formatCurrency(pendingCollection)}</span>
              </div>
            </div>

            {/* Informative billing notes */}
            <div className="bg-[#f8fafb] p-4 rounded-xl text-xs text-[#6f6f6e] leading-relaxed border border-[#6f6f6e]/10">
              <p>
                <strong>Resguardo en Pesos Argentinos ($):</strong> Las cotizaciones e ítems de diseño se encuentran automatizados bajo un esquema local de indexación constante. Puedes actualizar precios base de folletería, marcas o programaciones web en la pestaña <strong>Catálogo</strong> para ajustar la facturación general de forma inmediata.
              </p>
            </div>
          </div>

          {/* Quick budget snapshot overview table */}
          <div className="bg-white p-6 rounded-2xl border border-[#6f6f6e]/15 shadow-sm space-y-4">
            <div className="flex justify-between items-center text-sm mb-1">
              <h3 className="font-bold text-gray-900 tracking-tight">
                Historial Breve de Presupuestos
              </h3>
              <button
                onClick={() => onNavigate('budgets')}
                className="text-[#34877c] hover:underline font-bold text-xs"
              >
                Auditar Todos ({budgets.length}) &rarr;
              </button>
            </div>

            <div className="border border-[#6f6f6e]/15 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-[#f8fafb] text-[#6f6f6e] font-bold border-b border-[#6f6f6e]/10">
                  <tr>
                    <th className="p-3">Código ID</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3 text-right font-semibold">Total</th>
                    <th className="p-3 text-center">Estado Comercial</th>
                    <th className="p-3 text-center">Estado de Cobro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {budgets.slice(0, 4).map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-[#34877c]">{b.id}</td>
                      <td className="p-3 font-semibold text-gray-700">{b.clientName}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatCurrency(b.total)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          b.status === 'Aprobado' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : b.status === 'Borrador'
                            ? 'bg-slate-50 text-slate-800 border border-slate-200'
                            : b.status === 'Enviado'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          b.paymentStatus === 'Completo' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : b.paymentStatus === 'Parcial' 
                            ? 'bg-amber-55 text-amber-800 bg-amber-50 border border-amber-100' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {b.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 1/3: Client analytics & recent registration records */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Distribución por Perfil de Cliente */}
          <div className="bg-white p-6 rounded-2xl border border-[#6f6f6e]/15 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 leading-snug">Perfiles de Clientes</h3>
              <p className="text-xs text-gray-500">Clasificación activa para cotizador de Estudio UNKE.</p>
            </div>
            
            <div className="space-y-3.5">
              {[
                { tag: 'Categoría A / Empresa Grande', desc: 'Tarifa Corporativa (Multipl. 1.5x)', count: clients.filter(c => c.category === 'A').length, color: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
                { tag: 'Categoría B / Pyme o Estudio', desc: 'Tarifa Estándar (Multipl. 1.0x)', count: clients.filter(c => c.category === 'B' || !c.category).length, color: 'bg-[#34877c]', text: 'text-[#34877c]', bg: 'bg-[#34877c]/5' },
                { tag: 'Categoría C / Emprendedor', desc: 'Tarifa Especial (Multipl. 0.8x)', count: clients.filter(c => c.category === 'C').length, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
              ].map((item, idx) => {
                const totalClients = clients.length || 1;
                const ratio = Math.round((item.count / totalClients) * 100);
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-gray-800 text-[11px]">{item.tag}</span>
                      <span className={`${item.text} ${item.bg} px-1.5 py-0.5 rounded text-[9px] font-mono`}>{item.count} ({ratio}%)</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium leading-none">{item.desc}</p>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full transition-all duration-500`} style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Últimos Clientes Registrados */}
          <div className="bg-white p-6 rounded-2xl border border-[#6f6f6e]/15 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 leading-snug">Clientes Recientes</h3>
              <button
                onClick={() => onNavigate('clients')}
                className="text-[#34877c] hover:underline font-bold text-[10px] cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            {clients.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">Sin clientes registrados aún.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {clients.slice(0, 3).map(client => (
                  <div key={client.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-gray-800 truncate max-w-[130px]">{client.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{client.company || 'Empresa Independiente'}</p>
                    </div>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                      client.category === 'A' 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' 
                        : client.category === 'C'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-[#34877c]/10 text-[#34877c] border border-[#34877c]/20'
                    }`}>
                      Cat. {client.category || 'B'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
