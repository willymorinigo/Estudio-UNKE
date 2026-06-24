/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, ProjectTask, PreloadedTask, MaintenancePayment } from '../types';
import { formatCurrency, formatDateDMY } from '../pdfExport';
import { 
  FolderGit2, CheckCircle2, Circle, Plus, Trash2, 
  Clock, TrendingUp, Calendar, Inbox, CheckSquare, Sparkles,
  Edit, CreditCard, RefreshCw
} from 'lucide-react';

function advanceOneMonth(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00'); // noon to avoid TZ issues
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split('T')[0];
}

interface ProjectsListProps {
  projects: Project[];
  preloadedTasks: PreloadedTask[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  initiallySelectedProjectId?: string | null;
  onClearInitiallySelectedProject?: () => void;
  onNavigateToBudget?: (budgetId: string) => void;
  activePartner?: string;
}

export default function ProjectsList({
  projects,
  preloadedTasks,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  initiallySelectedProjectId,
  onClearInitiallySelectedProject,
  onNavigateToBudget,
  activePartner
}: ProjectsListProps) {
  // Navigation
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );

  useEffect(() => {
    if (initiallySelectedProjectId) {
      setSelectedProjectId(initiallySelectedProjectId);
      if (onClearInitiallySelectedProject) {
        onClearInitiallySelectedProject();
      }
    }
  }, [initiallySelectedProjectId, onClearInitiallySelectedProject]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Creating project state
  const [isCreating, setIsCreating] = useState(false);
  const [pName, setPName] = useState('');
  const [pClientName, setPClientName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pStatus, setPStatus] = useState<ProjectStatus>('En Progreso');
  const [pCategory, setPCategory] = useState('Identidad'); // Auto task injection
  const [pEstimatedDeliveryDate, setPEstimatedDeliveryDate] = useState('');
  const [pIsMonthlyMaintenance, setPIsMonthlyMaintenance] = useState(false);
  const [pMonthlyAmount, setPMonthlyAmount] = useState('');
  const [pNextDueDate, setPNextDueDate] = useState('');

  // Editing project state
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editIsMonthlyMaintenance, setEditIsMonthlyMaintenance] = useState(false);
  const [editMonthlyAmount, setEditMonthlyAmount] = useState<number>(0);
  const [editNextDueDate, setEditNextDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('En Progreso');

  // Registering payment state
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);
  const [payDate, setPayDate] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payPeriod, setPayPeriod] = useState('');
  const [payMethod, setPayMethod] = useState('Transferencia');
  const [payNotes, setPayNotes] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Editing and maintenance/recurrence states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Task inline state
  const [newTaskName, setNewTaskName] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  // Percentage complete calculation
  const getProgress = (proj: Project) => {
    if (proj.tasks.length === 0) return 0;
    const completed = proj.tasks.filter(t => t.completed).length;
    return Math.round((completed / proj.tasks.length) * 100);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pClientName.trim()) return;

    // Auto-inject some preselected tasks belonging to that category
    const categoryTasks = preloadedTasks
      .filter(t => t.category === pCategory)
      .map(t => ({
        id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: t.name,
        completed: false
      }));

    const newProj: Project = {
      id: `prj_${Date.now()}`,
      clientId: 'cli_custom', // General client code
      clientName: pClientName,
      name: pName,
      description: pDesc,
      status: pStatus,
      startDate: new Date().toISOString().split('T')[0],
      tasks: categoryTasks.length > 0 ? categoryTasks : [
        { id: `t_${Date.now()}_1`, name: 'Reunion de Kickoff', completed: false },
        { id: `t_${Date.now()}_2`, name: 'Presentar bocetos preliminares', completed: false },
        { id: `t_${Date.now()}_3`, name: 'Entrega final y aprobacion de piezas', completed: false }
      ],
      pieces: [],
      estimatedDeliveryDate: pEstimatedDeliveryDate || undefined,
      isMonthlyMaintenance: pIsMonthlyMaintenance,
      monthlyAmount: pIsMonthlyMaintenance ? (parseFloat(pMonthlyAmount) || undefined) : undefined,
      nextDueDate: pIsMonthlyMaintenance ? (pNextDueDate || undefined) : undefined,
      maintenancePayments: []
    };

    onAddProject(newProj);
    setSelectedProjectId(newProj.id);
    setIsCreating(false);

    // Reset
    setPName('');
    setPClientName('');
    setPDesc('');
    setPStatus('En Progreso');
    setPEstimatedDeliveryDate('');
    setPIsMonthlyMaintenance(false);
    setPMonthlyAmount('');
    setPNextDueDate('');
  };

  // Update specific task recurrence / details
  const handleUpdateTaskDetails = (taskId: string, updates: Partial<ProjectTask>) => {
    if (!selectedProject) return;
    const updatedTasks = selectedProject.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, ...updates };
      }
      return t;
    });

    onUpdateProject({
      ...selectedProject,
      tasks: updatedTasks
    });
  };

  // Update project delivery date
  const handleUpdateDeliveryDate = (date: string) => {
    if (!selectedProject) return;
    onUpdateProject({
      ...selectedProject,
      estimatedDeliveryDate: date ? date : (null as any)
    });
  };

  // Toggle checklist status
  const handleToggleTask = (taskIndex: number) => {
    if (!selectedProject) return;
    const updatedTasks = [...selectedProject.tasks];
    updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;

    const updatedProject: Project = {
      ...selectedProject,
      tasks: updatedTasks,
      endDate: updatedTasks.every(t => t.completed) ? new Date().toISOString().split('T')[0] : undefined
    };

    onUpdateProject(updatedProject);
  };

  // Inject a manual custom task
  const handleAddManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskName.trim()) return;

    const newTask: ProjectTask = {
      id: `t_${Date.now()}`,
      name: newTaskName,
      completed: false
    };

    const updatedProject: Project = {
      ...selectedProject,
      tasks: [...selectedProject.tasks, newTask]
    };

    onUpdateProject(updatedProject);
    setNewTaskName('');
  };

  // Quick Inject / Remove preloaded task from pool (permite tildar y destildar)
  const handleQuickInjectTask = (taskName: string) => {
    if (!selectedProject) return;

    const exists = selectedProject.tasks.some(t => t.name === taskName);
    let updatedTasks: ProjectTask[];

    if (exists) {
      // Destildar: remover la tarea del listado del proyecto
      updatedTasks = selectedProject.tasks.filter(t => t.name !== taskName);
    } else {
      // Tildar: agregar la nueva tarea al proyecto
      const newTask: ProjectTask = {
        id: `t_${Date.now()}`,
        name: taskName,
        completed: false
      };
      updatedTasks = [...selectedProject.tasks, newTask];
    }

    const updatedProject: Project = {
      ...selectedProject,
      tasks: updatedTasks
    };

    onUpdateProject(updatedProject);
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (!selectedProject) return;
    const updatedTasks = selectedProject.tasks.filter(t => t.id !== taskId);

    const updatedProject: Project = {
      ...selectedProject,
      tasks: updatedTasks
    };

    onUpdateProject(updatedProject);
  };

  // Update overall Project Status
  const handleUpdateStatus = (status: ProjectStatus) => {
    if (!selectedProject) return;

    const updatedProject: Project = {
      ...selectedProject,
      status: status,
      endDate: status === 'Completado' ? new Date().toISOString().split('T')[0] : undefined
    };

    onUpdateProject(updatedProject);
  };

  // Edit project handlers
  const handleOpenEditProject = () => {
    if (!selectedProject) return;
    setEditProjectName(selectedProject.name);
    setEditClientName(selectedProject.clientName);
    setEditDescription(selectedProject.description || '');
    setEditStartDate(selectedProject.startDate);
    setEditStatus(selectedProject.status);
    setEditIsMonthlyMaintenance(!!selectedProject.isMonthlyMaintenance);
    setEditMonthlyAmount(selectedProject.monthlyAmount || 0);
    setEditNextDueDate(selectedProject.nextDueDate || '');
    setIsEditingProject(true);
  };

  const handleSaveProjectEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const updatedProj: Project = {
      ...selectedProject,
      name: editProjectName.trim(),
      clientName: editClientName.trim(),
      description: editDescription.trim(),
      startDate: editStartDate,
      status: editStatus,
      isMonthlyMaintenance: editIsMonthlyMaintenance,
      monthlyAmount: editIsMonthlyMaintenance ? editMonthlyAmount : undefined,
      nextDueDate: editIsMonthlyMaintenance ? (editNextDueDate || undefined) : undefined,
      endDate: editStatus === 'Completado' ? (selectedProject.endDate || new Date().toISOString().split('T')[0]) : undefined,
    };

    onUpdateProject(updatedProj);
    setIsEditingProject(false);
  };

  // Register payment handlers
  const handleOpenRegisterPayment = () => {
    if (!selectedProject) return;
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayAmount(selectedProject.monthlyAmount?.toString() || '');
    
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const today = new Date();
    setPayPeriod(`${months[today.getMonth()]} ${today.getFullYear()}`);
    setPayMethod('Transferencia');
    setPayNotes('');
    setAutoAdvance(true);
    setIsRegisteringPayment(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const amount = parseFloat(payAmount) || 0;
    const newPayment: MaintenancePayment = {
      id: `pay_${Date.now()}`,
      date: payDate,
      amount,
      period: payPeriod.trim(),
      method: payMethod,
      notes: payNotes.trim() || undefined,
      registeredBy: activePartner
    };

    const currentPayments = selectedProject.maintenancePayments || [];
    const updatedPayments = [...currentPayments, newPayment];

    let updatedNextDueDate = selectedProject.nextDueDate;
    if (autoAdvance && selectedProject.nextDueDate) {
      updatedNextDueDate = advanceOneMonth(selectedProject.nextDueDate);
    }

    const updatedProj: Project = {
      ...selectedProject,
      maintenancePayments: updatedPayments,
      nextDueDate: updatedNextDueDate,
    };

    onUpdateProject(updatedProj);
    setIsRegisteringPayment(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!selectedProject || !confirm('¿Estás seguro de que deseas eliminar este registro de pago?')) return;
    const currentPayments = selectedProject.maintenancePayments || [];
    const updatedPayments = currentPayments.filter(p => p.id !== paymentId);

    onUpdateProject({
      ...selectedProject,
      maintenancePayments: updatedPayments,
    });
  };

  const getNextDueDateStatus = (dueDateStr?: string) => {
    if (!dueDateStr) return { label: 'Sin vencimiento', color: 'text-gray-400 bg-gray-150' };
    const todayStr = new Date().toISOString().split('T')[0];
    if (dueDateStr < todayStr) {
      return { label: 'Vencido', color: 'text-red-700 bg-red-100 border border-red-200' };
    }
    const today = new Date(todayStr + 'T12:00:00');
    const due = new Date(dueDateStr + 'T12:00:00');
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return { label: `Vence en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`, color: 'text-amber-700 bg-amber-100 border border-amber-200' };
    }
    return { label: 'Al día', color: 'text-emerald-700 bg-emerald-100/85 border border-emerald-200' };
  };

  return (
    <div className="space-y-6" id="projects-manager-section">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-[#34877c]" />
            Control de Proyectos & Entregables
          </h2>
          <p className="text-sm text-gray-500">
            Seguimiento de tareas por proyectos activos, auto-cálculo de avances de marca e inyección de flujos recomendados.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-[#34877c] hover:bg-[#2c7269] text-white py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition self-start"
        >
          <Plus className="w-4 h-4" /> Lanzar Proyecto Ad-hoc
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Lanzar Nuevo Proyecto de Diseño</h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre Comercial del Proyecto *</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={e => setPName(e.target.value)}
                  placeholder="Ej. Rediseño de Identidad Visual Mandarina II"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cliente / Compañía Destinataria *</label>
                <input
                  type="text"
                  required
                  value={pClientName}
                  onChange={e => setPClientName(e.target.value)}
                  placeholder="Ej. Mandarina Café"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cargar Flujo Sugerido por Categoría</label>
                <select
                  value={pCategory}
                  onChange={e => setPCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none"
                >
                  <option value="Identidad">Identidad Corporativa (4 Tareas preestablecidas)</option>
                  <option value="Web">Diseño & Programación Web (6 Tareas preestablecidas)</option>
                  <option value="Marketing">Marketing / Tráfico de Redes (2 Tareas preestablecidas)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Fecha Tentativa de Entrega</label>
                <input
                  type="date"
                  value={pEstimatedDeliveryDate}
                  onChange={e => setPEstimatedDeliveryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Descripción de Objetivos</label>
                <textarea
                  rows={2}
                  value={pDesc}
                  onChange={e => setPDesc(e.target.value)}
                  placeholder="Redacta las pautas primarias estipuladas para este proyecto."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pIsMonthlyMaintenance}
                    onChange={e => setPIsMonthlyMaintenance(e.target.checked)}
                    className="rounded border-gray-300 text-[#34877c] focus:ring-[#34877c]"
                  />
                  <span className="text-sm font-semibold text-gray-700">¿Es un servicio de Mantenimiento Mensual Recurrente?</span>
                </label>
              </div>

              {pIsMonthlyMaintenance && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Abono Mensual ($) *</label>
                    <input
                      type="number"
                      required={pIsMonthlyMaintenance}
                      value={pMonthlyAmount}
                      onChange={e => setPMonthlyAmount(e.target.value)}
                      placeholder="Ej. 45000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Próximo Vencimiento *</label>
                    <input
                      type="date"
                      required={pIsMonthlyMaintenance}
                      value={pNextDueDate}
                      onChange={e => setPNextDueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#34877c] hover:bg-[#2c7269] text-white rounded-xl text-sm font-semibold"
              >
                Crear Proyecto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main double column body layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Project selective column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#34877c]" />
              Proyectos en Curso
            </h3>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic text-xs">
                  Aún no posees proyectos en curso. Genera uno aprobando presupuestos.
                </div>
              ) : (
                projects.map(proj => {
                  const pct = getProgress(proj);
                  const isSelected = selectedProjectId === proj.id;
                  
                  return (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                        isSelected 
                          ? 'bg-slate-50 border-[#34877c] ring-1 ring-[#34877c]/20' 
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {proj.isMonthlyMaintenance && (
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                          <span className="font-bold text-xs text-gray-800 line-clamp-1">{proj.name}</span>
                        </div>
                        <span className={`text-[8.5px] px-2 py-0.5 rounded font-black shrink-0 ${
                          proj.status === 'Completado' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : proj.status === 'En Revision'
                            ? 'bg-amber-100 text-amber-800'
                            : proj.status === 'Pausado'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-teal-50 text-[#34877c]'
                        }`}>
                          {proj.status}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-gray-500 font-medium mb-3">Cliente: {proj.clientName}</p>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-gray-500 font-semibold">
                          <span>Progreso de Tareas:</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct === 100 ? 'bg-emerald-500' : 'bg-[#34877c]'
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[8px] text-gray-400">
                           <span>Iniciado: {formatDateDMY(proj.startDate)}</span>
                           <span>{proj.tasks.filter(t => t.completed).length}/{proj.tasks.length} completas</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Project interactive Checklist & Scope */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6" id="active-project-card">
              
              {/* Project Header details & Action status update */}
              <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#34877c]" /> Carpeta Técnica de Trabajo
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedProject.name}</h3>
                    <button
                      onClick={handleOpenEditProject}
                      className="text-gray-405 hover:text-[#34877c] p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer shrink-0"
                      title="Editar detalles del trabajo / mantenimiento"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#34877c] font-semibold mt-0.5">Cliente Destinatario: {selectedProject.clientName}</p>
                  
                  {selectedProject.createdBy && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[8px] bg-slate-100 text-gray-500 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        📁 Creado por: {selectedProject.createdBy}
                      </span>
                      {selectedProject.updatedBy && (
                        <span className="text-[8px] bg-[#34877c]/10 text-[#34877c] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          ✏️ Modificado: {selectedProject.updatedBy}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Cambiar Estado:</span>
                  <select
                    value={selectedProject.status}
                    onChange={e => handleUpdateStatus(e.target.value as ProjectStatus)}
                    className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    <option value="Planificado">Planificado</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="En Revision">En Revisión</option>
                    <option value="Completado">Completado</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>
              </div>

              {/* Description and Date stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Resumen / Alcance Operomodal</span>
                  <p className="text-xs text-gray-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                    {selectedProject.description || 'Sin descripción pormenorizada cargada en el lanzamiento.'}
                  </p>
                </div>
                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Lanzamiento: <strong>{formatDateDMY(selectedProject.startDate)}</strong></span>
                  </div>
                  {selectedProject.endDate && (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Terminado el: <strong>{formatDateDMY(selectedProject.endDate)}</strong></span>
                    </div>
                  )}
                  {selectedProject.budgetId && (
                    <div 
                      className="text-[10px] text-[#34877c] hover:bg-teal-50 bg-white border border-teal-100 p-1.5 px-2.5 rounded font-mono truncate text-center cursor-pointer font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                      onClick={() => onNavigateToBudget && onNavigateToBudget(selectedProject.budgetId!)}
                      title="Ver Presupuesto Comercial Vinculado"
                    >
                      <span>Presupuesto: {selectedProject.budgetId}</span>
                      <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-500 animate-pulse" />
                    </div>
                  )}
                  <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200/50 mt-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[8px] uppercase font-bold text-gray-450 tracking-wider">Fecha Est. de Entrega</label>
                      {selectedProject.estimatedDeliveryDate && (
                        <button
                          type="button"
                          onClick={() => handleUpdateDeliveryDate('')}
                          className="text-[8px] font-extrabold text-red-500 hover:text-red-700 uppercase tracking-wider cursor-pointer"
                        >
                          Blanquear
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={selectedProject.estimatedDeliveryDate || ''}
                      onChange={e => handleUpdateDeliveryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded p-1 text-[11px] text-gray-800 font-semibold focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque de Mantenimiento Mensual */}
              {selectedProject.isMonthlyMaintenance && (
                <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100/50 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">Mantenimiento Mensual Activo</h4>
                        <p className="text-[10px] text-gray-400">Seguimiento de abonos recurrentes y control de cobros.</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleOpenRegisterPayment}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition self-start shadow-sm cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Registrar Cobro Mensual
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-emerald-100/50 p-3 rounded-xl">
                      <span className="block text-[8px] uppercase font-black text-gray-400 tracking-wider">Abono Mensual</span>
                      <span className="text-base font-black text-emerald-700">{formatCurrency(selectedProject.monthlyAmount || 0)}</span>
                    </div>

                    <div className="bg-white border border-emerald-100/50 p-3 rounded-xl">
                      <span className="block text-[8px] uppercase font-black text-gray-400 tracking-wider">Próximo Vencimiento</span>
                      <span className="text-xs font-bold text-gray-800 block mt-0.5">
                        {selectedProject.nextDueDate ? formatDateDMY(selectedProject.nextDueDate) : 'Sin estipular'}
                      </span>
                    </div>

                    <div className="bg-white border border-emerald-100/50 p-3 rounded-xl flex flex-col justify-center">
                      <span className="block text-[8px] uppercase font-black text-gray-400 tracking-wider mb-1">Estado de Cuenta</span>
                      <div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-block ${getNextDueDateStatus(selectedProject.nextDueDate).color}`}>
                          {getNextDueDateStatus(selectedProject.nextDueDate).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Historial de Cobros */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Historial de Pagos de Mantenimiento</span>
                    {!selectedProject.maintenancePayments || selectedProject.maintenancePayments.length === 0 ? (
                      <div className="text-center py-6 bg-white/50 border border-dashed border-emerald-100 rounded-xl text-xs text-gray-400 italic">
                        Aún no se han registrado cobros para este abono de mantenimiento.
                      </div>
                    ) : (
                      <div className="border border-emerald-100/50 rounded-xl overflow-hidden bg-white max-h-[180px] overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-emerald-50/40 text-[9px] font-extrabold uppercase text-emerald-850 tracking-wider border-b border-emerald-100/50">
                              <th className="p-2.5 pl-3">Período</th>
                              <th className="p-2.5">Fecha de Pago</th>
                              <th className="p-2.5">Medio de Pago</th>
                              <th className="p-2.5 text-right">Monto Recibido</th>
                              <th className="p-2.5 text-center">Socio</th>
                              <th className="p-2.5 text-center w-8">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50/30 font-semibold text-gray-700">
                            {selectedProject.maintenancePayments.slice().reverse().map(pay => (
                              <tr key={pay.id} className="hover:bg-slate-50/30">
                                <td className="p-2 pl-3 font-bold text-gray-900">{pay.period}</td>
                                <td className="p-2 text-gray-500">{formatDateDMY(pay.date)}</td>
                                <td className="p-2 text-gray-550">{pay.method}</td>
                                <td className="p-2 text-right font-mono font-bold text-emerald-600">{formatCurrency(pay.amount)}</td>
                                <td className="p-2 text-center text-[10px] text-gray-450 font-bold">{pay.registeredBy || '-'}</td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePayment(pay.id)}
                                    className="text-gray-300 hover:text-red-500 p-0.5 rounded cursor-pointer transition inline-flex items-center justify-center"
                                    title="Eliminar cobro registrado"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scope assigned design pieces: auto counting preloaded weights */}
              {selectedProject.pieces && selectedProject.pieces.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Piezas de Trabajo Incluidas (Sumatoria Técnica: {formatCurrency(selectedProject.pieces.reduce((sum, p) => sum + p.subtotal, 0))})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProject.pieces.map(piece => (
                      <div key={piece.id} className="p-2.5 bg-[#34877c]/5 border border-[#34877c]/15 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-gray-800 line-clamp-1">{piece.name}</p>
                          <p className="text-[10px] text-gray-400">Cant: {piece.quantity} unit.</p>
                        </div>
                        <span className="font-mono font-bold text-[#34877c]">{formatCurrency(piece.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist and quick presets tasks injector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* CHECKLIST LIST */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Checklist de Control Operativo</h4>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {selectedProject.tasks.filter(t => t.completed).length}/{selectedProject.tasks.length} Realizadas
                    </span>
                  </div>

                  {/* Manual Task Creator */}
                  <form onSubmit={handleAddManualTask} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Insertar tarea personalizada sobre la marcha..."
                      value={newTaskName}
                      onChange={e => setNewTaskName(e.target.value)}
                      className="flex-grow bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-[#34877c] hover:bg-[#2c7269] text-white text-xs px-3 rounded-lg font-bold transition flex items-center gap-0.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </form>

                  <div className="space-y-1 bg-white max-h-[300px] overflow-y-auto pr-1">
                    {selectedProject.tasks.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 italic text-xs">
                        No hay tareas configuradas en este checklist de proyecto.
                      </div>
                    ) : (
                      selectedProject.tasks.map((task, idx) => {
                        const isEditingThis = editingTaskId === task.id;
                        return (
                          <div
                            key={task.id}
                            className="flex flex-col border border-slate-100/80 rounded-xl p-1 bg-white hover:bg-slate-50/20 hover:border-slate-200/50 transition duration-150"
                          >
                            <div className="flex justify-between items-center p-1 px-2 text-xs">
                              <div 
                                onClick={() => handleToggleTask(idx)}
                                className="flex items-center gap-2.5 cursor-pointer flex-grow select-none pr-2"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                                )}
                                <div className="flex flex-col text-left">
                                  <span className={`text-gray-700 leading-tight ${task.completed ? 'line-through text-gray-400 font-sans font-normal' : 'font-semibold text-[11px]'}`}>
                                    {task.name}
                                  </span>
                                  {task.isMaintenance && (
                                    <span className="text-[9px] text-emerald-650 font-black uppercase tracking-wider mt-0.5 inline-flex items-center gap-1">
                                      🔄 Mensualizado {task.monthlyBillingDay ? `(Cobro: Día ${task.monthlyBillingDay})` : ''} 
                                      {task.monthlyBillingAmount ? ` — ${formatCurrency(task.monthlyBillingAmount)}` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTaskId(isEditingThis ? null : task.id);
                                  }}
                                  className={`p-1.5 rounded-lg hover:bg-slate-100 transition duration-100 cursor-pointer ${task.isMaintenance ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 hover:text-gray-600'}`}
                                  title="Configurar recurrencia y cobro mensual de mantenimiento"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                  className="text-gray-300 hover:text-red-500 p-1 rounded transition"
                                  title="Quitar tarea"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isEditingThis && (
                              <div className="mx-2 mb-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/50 text-[10px] text-gray-600 space-y-2 animate-in slide-in-from-top-1 duration-100">
                                <div className="flex items-center justify-between border-b border-gray-150 pb-1">
                                  <span className="font-extrabold text-gray-700 uppercase tracking-widest text-[9px]">Ajustes de Mantenimiento</span>
                                  <span className="text-[8px] font-mono font-bold text-gray-400">Tarea ID: {task.id.slice(-6)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 py-0.5">
                                  <input
                                    type="checkbox"
                                    id={`maintenance-check-${task.id}`}
                                    checked={!!task.isMaintenance}
                                    onChange={e => handleUpdateTaskDetails(task.id, { isMaintenance: e.target.checked })}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <label htmlFor={`maintenance-check-${task.id}`} className="font-bold text-gray-750 cursor-pointer select-none text-[11px]">
                                    Esta tarea requiere Mantenimiento Continuo
                                  </label>
                                </div>

                                {task.isMaintenance && (
                                  <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-100">
                                    <div className="space-y-1">
                                      <label className="block text-[8px] uppercase font-bold text-gray-450">Día de Cobro (1-31)</label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={task.monthlyBillingDay || ''}
                                        onChange={e => handleUpdateTaskDetails(task.id, { monthlyBillingDay: parseInt(e.target.value) || undefined })}
                                        placeholder="Ej. 10"
                                        className="w-full bg-white border border-slate-200 rounded-lg p-1 px-2 text-xs font-bold text-gray-850 focus:outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[8px] uppercase font-bold text-gray-450">Abono Mensual ($)</label>
                                      <input
                                        type="number"
                                        value={task.monthlyBillingAmount || ''}
                                        onChange={e => handleUpdateTaskDetails(task.id, { monthlyBillingAmount: parseFloat(e.target.value) || undefined })}
                                        placeholder="Ej. 65000"
                                        className="w-full bg-white border border-slate-200 rounded-lg p-1 px-2 text-xs font-bold text-gray-850 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* QUICK PRESETS INJECTOR */}
                <div className="md:col-span-1 space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-[#34877c]" />
                    <span className="text-[10px] uppercase font-bold text-gray-800 tracking-wider">Inyector de Tareas</span>
                  </div>
                  <p className="text-[9.5px] leading-relaxed text-gray-400">
                    Añade instantáneamente tareas del catálogo pre-definido para agilizar la agenda:
                  </p>

                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                    {preloadedTasks.map(tTask => {
                      const exists = selectedProject.tasks.some(t => t.name === tTask.name);
                      return (
                        <button
                          key={tTask.id}
                          type="button"
                          onClick={() => handleQuickInjectTask(tTask.name)}
                          className={`w-full text-left p-2.5 rounded-xl text-[10px] border transition flex items-start gap-2.5 cursor-pointer ${
                            exists 
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-rose-50 hover:border-rose-150 hover:text-rose-700' 
                              : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700 font-medium'
                          }`}
                          title={exists ? "Haga clic para remover (destildar) esta tarea del proyecto" : "Haga clic para inyectar esta tarea al proyecto"}
                        >
                          <div className="mt-0.5 shrink-0">
                            {exists ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex flex-col justify-start gap-0.5 flex-1">
                            <span className={`line-clamp-2 leading-snug ${exists ? 'font-semibold' : ''}`}>{tTask.name}</span>
                            <span className={`text-[7px] font-extrabold uppercase block tracking-wider mt-0.5 ${exists ? 'text-emerald-600' : 'text-gray-400'}`}>{tTask.category}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Action buttons footer */}
              <div className="flex justify-between items-center border-t border-slate-150 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setProjectToDelete(selectedProject);
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition"
                >
                  Eliminar Carpeta Proyecto
                </button>
                <div className="text-xs text-slate-400 italic">
                  Las tareas realizadas se registran inmediatamente en la caché del navegador.
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-[#34877c]/60">
                <FolderGit2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 font-sans">No hay ningún proyecto activo cargado</h4>
                <p className="text-xs text-gray-400 max-w-sm mt-1">
                  Agrega uno de forma directa con el botón "Lanzar Proyecto Ad-hoc" o aprueba presupuestos para automatizar su lanzamiento completo con flujos preconfeccionados.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE CARPETA DE PROYECTO */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 text-xs text-gray-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="bg-red-50 p-2 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">¿Eliminar Carpeta de Proyecto?</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la carpeta de trabajo del proyecto <strong className="text-gray-900">"{projectToDelete.name}"</strong>? Esta acción borrará todas sus tareas asociadas del sistema de forma irreversible.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProject(projectToDelete.id);
                  const remaining = projects.filter(p => p.id !== projectToDelete.id);
                  setSelectedProjectId(remaining.length > 0 ? remaining[0].id : null);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-md shadow-red-200"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE DETALLES DEL TRABAJO */}
      {isEditingProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full p-6 text-xs text-gray-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-[#34877c] mb-4">
              <div className="bg-teal-50 p-2 rounded-xl">
                <Edit className="w-5 h-5 text-[#34877c]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Editar Detalles del Trabajo</h3>
            </div>
            
            <form onSubmit={handleSaveProjectEdits} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre Comercial del Trabajo *</label>
                  <input
                    type="text"
                    required
                    value={editProjectName}
                    onChange={e => setEditProjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cliente / Compañía *</label>
                  <input
                    type="text"
                    required
                    value={editClientName}
                    onChange={e => setEditClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estado de Trabajo *</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none"
                  >
                    <option value="Planificado">Planificado</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="En Revision">En Revisión</option>
                    <option value="Completado">Completado</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción / Objetivos</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Escribe los objetivos o pautas de este trabajo..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                  />
                </div>

                <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editIsMonthlyMaintenance}
                      onChange={e => setEditIsMonthlyMaintenance(e.target.checked)}
                      className="rounded border-gray-300 text-[#34877c] focus:ring-[#34877c]"
                    />
                    <span className="text-xs font-bold text-gray-700">Este trabajo es un Mantenimiento Mensual Recurrente</span>
                  </label>
                </div>

                {editIsMonthlyMaintenance && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Abono Mensual ($) *</label>
                      <input
                        type="number"
                        required={editIsMonthlyMaintenance}
                        value={editMonthlyAmount}
                        onChange={e => setEditMonthlyAmount(parseFloat(e.target.value) || 0)}
                        placeholder="Ej. 45000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Próximo Vencimiento *</label>
                      <input
                        type="date"
                        required={editIsMonthlyMaintenance}
                        value={editNextDueDate}
                        onChange={e => setEditNextDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingProject(false)}
                  className="px-4 py-2 border border-slate-200 text-gray-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#34877c] hover:bg-[#2c7269] text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO DE COBRO DE MANTENIMIENTO */}
      {isRegisteringPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 text-xs text-gray-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <div className="bg-emerald-50 p-2 rounded-xl">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Registrar Cobro de Mantenimiento</h3>
            </div>
            
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Período correspondiente *</label>
                  <input
                    type="text"
                    required
                    value={payPeriod}
                    onChange={e => setPayPeriod(e.target.value)}
                    placeholder="Ej. Julio 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Monto Cobrado ($) *</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="Ej. 45000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fecha de Cobro *</label>
                    <input
                      type="date"
                      required
                      value={payDate}
                      onChange={e => setPayDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Medio de Pago *</label>
                    <select
                      value={payMethod}
                      onChange={e => setPayMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none"
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Mercado Pago">Mercado Pago</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notas / Observaciones</label>
                  <textarea
                    rows={2}
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    placeholder="Ej. Comprobante enviado por Whatsapp"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none"
                  />
                </div>

                {selectedProject.nextDueDate && (
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/30 flex items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      id="auto-advance-checkbox"
                      checked={autoAdvance}
                      onChange={e => setAutoAdvance(e.target.checked)}
                      className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <label htmlFor="auto-advance-checkbox" className="font-bold text-emerald-800 text-[10px] cursor-pointer">
                      Avanzar el próximo vencimiento 1 mes automáticamente (al {formatDateDMY(advanceOneMonth(selectedProject.nextDueDate))})
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisteringPayment(false)}
                  className="px-4 py-2 border border-slate-200 text-gray-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Registrar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
