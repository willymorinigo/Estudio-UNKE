/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, ProjectStatus, ProjectTask, PreloadedTask } from '../types';
import { formatCurrency } from '../pdfExport';
import { 
  FolderGit2, CheckCircle2, Circle, Plus, Trash2, 
  Clock, TrendingUp, Calendar, Inbox, CheckSquare, Sparkles 
} from 'lucide-react';

interface ProjectsListProps {
  projects: Project[];
  preloadedTasks: PreloadedTask[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export default function ProjectsList({
  projects,
  preloadedTasks,
  onAddProject,
  onUpdateProject,
  onDeleteProject
}: ProjectsListProps) {
  // Navigation
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Creating project state
  const [isCreating, setIsCreating] = useState(false);
  const [pName, setPName] = useState('');
  const [pClientName, setPClientName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pStatus, setPStatus] = useState<ProjectStatus>('En Progreso');
  const [pCategory, setPCategory] = useState('Identidad'); // Auto task injection

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
      pieces: []
    };

    onAddProject(newProj);
    setSelectedProjectId(newProj.id);
    setIsCreating(false);

    // Reset
    setPName('');
    setPClientName('');
    setPDesc('');
    setPStatus('En Progreso');
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

  // Quick Inject preloaded task from pool
  const handleQuickInjectTask = (taskName: string) => {
    if (!selectedProject) return;

    // Check if task of this name already exists
    if (selectedProject.tasks.some(t => t.name === taskName)) return;

    const newTask: ProjectTask = {
      id: `t_${Date.now()}`,
      name: taskName,
      completed: false
    };

    const updatedProject: Project = {
      ...selectedProject,
      tasks: [...selectedProject.tasks, newTask]
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
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-gray-800 line-clamp-1">{proj.name}</span>
                        <span className={`text-[8.5px] px-2 py-0.5 rounded font-black ${
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
                          <span>Iniciado: {proj.startDate}</span>
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
                  <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedProject.name}</h3>
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
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Lanzamiento: <strong>{selectedProject.startDate}</strong></span>
                  </div>
                  {selectedProject.endDate && (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Terminado el: <strong>{selectedProject.endDate}</strong></span>
                    </div>
                  )}
                  {selectedProject.budgetId && (
                    <div className="text-[10px] text-gray-400 bg-white border p-1 rounded font-mono truncate text-center">
                      Vinculado: {selectedProject.budgetId}
                    </div>
                  )}
                </div>
              </div>

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
                      selectedProject.tasks.map((task, idx) => (
                        <div
                          key={task.id}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition text-xs"
                        >
                          <div 
                            onClick={() => handleToggleTask(idx)}
                            className="flex items-center gap-2.5 cursor-pointer flex-grow select-none"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                            )}
                            <span className={`text-gray-700 leading-tight ${task.completed ? 'line-through text-gray-400 font-sans' : 'font-medium'}`}>
                              {task.name}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-gray-300 hover:text-red-500 p-1"
                            title="Quitar tarea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
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
                          disabled={exists}
                          onClick={() => handleQuickInjectTask(tTask.name)}
                          className={`w-full text-left p-2 rounded text-[10px] border transition flex flex-col justify-start gap-0.5 ${
                            exists 
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-white hover:bg-slate-100 border-slate-100 hover:border-slate-200 text-slate-700 font-medium'
                          }`}
                        >
                          <span className="line-clamp-2 leading-snug">{tTask.name}</span>
                          <span className="text-[7.5px] font-bold uppercase text-gray-400 block">{tTask.category}</span>
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

    </div>
  );
}
