/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DesignPiece, PreloadedTask } from '../types';
import { formatCurrency } from '../pdfExport';
import { Layers, Search, Plus, Trash2, Edit2, Sparkles, CheckSquare, MessageSquare, AlertCircle } from 'lucide-react';

interface InlinePriceInputProps {
  initialPrice: number;
  onSave: (newPrice: number) => void;
}

function InlinePriceInput({ initialPrice, onSave }: InlinePriceInputProps) {
  const [val, setVal] = useState(initialPrice.toString());

  React.useEffect(() => {
    setVal(initialPrice.toString());
  }, [initialPrice]);

  const handleBlur = () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num !== initialPrice) {
      onSave(num);
    } else {
      setVal(initialPrice.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setVal(initialPrice.toString());
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center justify-end gap-1 font-mono">
      <span className="text-gray-400 mr-0.5 font-bold">$</span>
      <input
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-24 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-xs focus:outline-none focus:border-[#34877c] font-bold text-gray-800 transition"
      />
    </div>
  );
}

interface PiecesManagerProps {
  pieces: DesignPiece[];
  tasks: PreloadedTask[];
  onAddPiece: (piece: DesignPiece) => void;
  onUpdatePiece: (piece: DesignPiece) => void;
  onDeletePiece: (id: string) => void;
  onAddTask: (task: PreloadedTask) => void;
  onDeleteTask: (id: string) => void;
  onForceSyncCatalog?: () => Promise<void>;
}

export default function PiecesManager({
  pieces,
  tasks,
  onAddPiece,
  onUpdatePiece,
  onDeletePiece,
  onAddTask,
  onDeleteTask,
  onForceSyncCatalog
}: PiecesManagerProps) {
  // Search state
  const [pieceQuery, setPieceQuery] = useState('');
  const [taskQuery, setTaskQuery] = useState('');
  const [pieceToDelete, setPieceToDelete] = useState<DesignPiece | null>(null);

  const [syncing, setSyncing] = useState(false);
  const handleSync = async () => {
    if (!onForceSyncCatalog) return;
    try {
      setSyncing(true);
      await onForceSyncCatalog();
      alert("¡Base de Datos de Piezas y Tareas sincronizada correctamente con Firestore!");
    } catch (err) {
      alert("Error al sincronizar el catálogo con Firestore.");
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  // Piece Form state
  const [isAddingPiece, setIsAddingPiece] = useState(false);
  const [editingPieceId, setEditingPieceId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('Identidad');
  const [pPrice, setPPrice] = useState('');
  const [pDesc, setPDesc] = useState('');

  // Task Form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [tName, setTName] = useState('');
  const [tCategory, setTCategory] = useState('Identidad');

  // Filtered lists
  const filteredPieces = pieces.filter(p => 
    p.name.toLowerCase().includes(pieceQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(pieceQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(pieceQuery.toLowerCase()))
  );

  const filteredTasks = tasks.filter(t =>
    t.name.toLowerCase().includes(taskQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(taskQuery.toLowerCase())
  );

  const handlePieceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pPrice) return;

    const priceNum = parseFloat(pPrice);
    if (isNaN(priceNum) || priceNum < 0) return;

    const pieceData: DesignPiece = {
      id: editingPieceId || `pc_${Date.now()}`,
      name: pName,
      category: pCategory,
      price: priceNum,
      description: pDesc
    };

    if (editingPieceId) {
      onUpdatePiece(pieceData);
    } else {
      onAddPiece(pieceData);
    }

    // Reset Form
    setIsAddingPiece(false);
    setEditingPieceId(null);
    setPName('');
    setPCategory('Identidad');
    setPPrice('');
    setPDesc('');
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) return;

    const taskData: PreloadedTask = {
      id: `tsk_${Date.now()}`,
      name: tName,
      category: tCategory
    };

    onAddTask(taskData);
    setIsAddingTask(false);
    setTName('');
    setTCategory('Identidad');
  };

  const startEditPiece = (piece: DesignPiece) => {
    setEditingPieceId(piece.id);
    setPName(piece.name);
    setPCategory(piece.category);
    setPPrice(piece.price.toString());
    setPDesc(piece.description || '');
    setIsAddingPiece(true);
  };

  return (
    <div className="space-y-8" id="pieces-manager-section">
      
      {/* Overview Head */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#34877c]" />
          Base de Datos de Piezas y Tareas
        </h2>
        <p className="text-sm text-gray-500">
          Repositorio de servicios pre-configurados con valores fijos en pesos para automatizar y agilizar presupuestos comerciales.
        </p>
      </div>

      {pieces.length === 0 && onForceSyncCatalog && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-left">
              <p className="font-bold text-amber-940 text-xs">El catálogo está vacío o desactualizado</p>
              <p className="text-[11px] text-amber-700 font-medium">Por seguridad o inicio de base limpia, puedes forzar la sincronización para cargar en Firestore todas las tarifas oficiales de Estudio UNKE definidas en la cotización comercial.</p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> {syncing ? 'Sincronizando...' : 'Cargar Tarifas Oficiales'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1 & 2: Design Pieces Catalogue (Product Table) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">Catálogo de Piezas de Diseño</h3>
                <p className="text-xs text-gray-500">Valores unitarios precargados para generación rápida.</p>
              </div>
              <div className="flex items-center gap-2">
                {onForceSyncCatalog && (
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition cursor-pointer"
                    title="Actualizar catálogo entero a valores e IDs oficiales de Estudio UNKE"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#34877c]" />
                    {syncing ? 'Sincronizando...' : 'Cargar Catálogo Oficial'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingPieceId(null);
                    setPName('');
                    setPCategory('Identidad');
                    setPPrice('');
                    setPDesc('');
                    setIsAddingPiece(true);
                  }}
                  className="bg-[#34877c] hover:bg-[#2c7269] text-white text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Nueva Pieza
                </button>
              </div>
            </div>

            {/* Piece Search */}
            <div className="relative">
              <input
                id="search-pieces-input"
                type="text"
                placeholder="Buscar pieza de diseño por descripción comercial o etiqueta..."
                value={pieceQuery}
                onChange={e => setPieceQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            </div>

            {/* Piece Creator Modal / Inline Form */}
            {isAddingPiece && (
              <form onSubmit={handlePieceSubmit} className="bg-slate-50 border border-[#34877c]/20 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  {editingPieceId ? 'Editar Detalles de la Pieza' : 'Registrar Nueva Pieza en Catálogo'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre Comercial de la Pieza *</label>
                    <input
                      type="text"
                      required
                      value={pName}
                      onChange={e => setPName(e.target.value)}
                      placeholder="Ej. Diseño de Web Corporativa (CMS)"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Categoría Temática</label>
                    <select
                      value={pCategory}
                      onChange={e => setPCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-gray-800 focus:outline-none"
                    >
                      <option value="Identidad">Identidad</option>
                      <option value="Web">Web</option>
                      <option value="Marketing">Marketing / Social</option>
                      <option value="Folletería">Folletería</option>
                      <option value="Presentaciones">Presentaciones</option>
                      <option value="Editorial">Editorial</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Valor Unitario Prefijado ($ ARS) *</label>
                    <input
                      type="number"
                      required
                      value={pPrice}
                      onChange={e => setPPrice(e.target.value)}
                      placeholder="Ej. 180000"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Descripción del Servicio</label>
                    <input
                      type="text"
                      value={pDesc}
                      onChange={e => setPDesc(e.target.value)}
                      placeholder="Breve reseña técnica sobre qué incluye la pieza para los reportes..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsAddingPiece(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-gray-600 rounded-lg hover:bg-slate-100 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#34877c] text-white rounded-lg hover:bg-[#2c7269] font-semibold"
                  >
                    {editingPieceId ? 'Aplicar Cambios' : 'Inyectar al Catálogo'}
                  </button>
                </div>
              </form>
            )}

            {/* List Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-[#34877c]/5 text-gray-800 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">Servicio / Pieza Técnica</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Valor Prefijado</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredPieces.map(piece => (
                    <tr key={piece.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <p className="font-bold text-gray-800">{piece.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-gray-400 font-semibold uppercase">
                          {piece.createdBy && <span>🧑‍💻 {piece.createdBy}</span>}
                          {piece.updatedBy && piece.updatedBy !== piece.createdBy && <span> • ✏️ {piece.updatedBy}</span>}
                        </div>
                        {piece.description && <p className="text-[10px] text-gray-400 italic max-w-sm truncate mt-1">{piece.description}</p>}
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {piece.category}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <InlinePriceInput
                          initialPrice={piece.price}
                          onSave={(newPrice) => {
                            onUpdatePiece({
                              ...piece,
                              price: newPrice
                            });
                          }}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEditPiece(piece)}
                            className="p-1 hover:text-[#34877c] hover:bg-slate-100 text-gray-400 rounded transition"
                            title="Editar pieza"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setPieceToDelete(piece);
                            }}
                            className="p-1 hover:text-red-500 hover:bg-slate-100 text-gray-400 rounded transition"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* COL 3: Presaved Reusable Tasks pool */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1">
                  <CheckSquare className="w-4 h-4 text-[#34877c]" />
                  Tareas Reseteables
                </h3>
                <p className="text-[11px] text-gray-500">Tareas predefinidas por categorías para clonar.</p>
              </div>
              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="text-[#34877c] hover:text-[#2c7269] text-xs font-bold bg-[#34877c]/10 p-1.5 rounded-lg transition"
                title="Nueva tarea sugerida"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Injected quick task form */}
            {isAddingTask && (
              <form onSubmit={handleTaskSubmit} className="p-3 bg-slate-50 border border-[#34877c]/20 rounded-xl space-y-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Nombre de la Tarea Sugerida</label>
                  <input
                    type="text"
                    required
                    value={tName}
                    onChange={e => setTName(e.target.value)}
                    placeholder="Ej. Diseño de firmas de correo"
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-gray-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Filtro de Categoría</label>
                  <select
                    value={tCategory}
                    onChange={e => setTCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-gray-800"
                  >
                    <option value="Identidad">Identidad</option>
                    <option value="Web">Web</option>
                    <option value="Marketing">Marketing / Social</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div className="flex justify-end gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-2 py-1 bg-white border text-gray-600 rounded"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-1 bg-[#34877c] text-white rounded font-bold"
                  >
                    Inyectar Tarea
                  </button>
                </div>
              </form>
            )}

            {/* Task Search list */}
            <div className="relative">
              <input
                id="search-tasks-input"
                type="text"
                placeholder="Buscar tareas precargadas..."
                value={taskQuery}
                onChange={e => setTaskQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-gray-800 focus:outline-none"
              />
              <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredTasks.map(task => (
                <div key={task.id} className="flex justify-between items-center p-2 bg-slate-50/50 hover:bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div className="max-w-[170px]">
                    <p className="font-medium text-gray-700 leading-snug">{task.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{task.category}</span>
                      {task.createdBy && (
                        <span className="text-[8px] text-gray-400 uppercase tracking-wider">
                          • 🧑‍💻 {task.createdBy}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded"
                    title="Remover tarea sugerida"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE PIEZA */}
      {pieceToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 text-xs text-gray-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="bg-red-50 p-2 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">¿Remover Pieza del Catálogo?</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar <strong className="text-gray-900">"{pieceToDelete.name}"</strong> de la base de datos de precios de catálogo? Los presupuestos existentes que utilicen esta pieza no serán modificados.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setPieceToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePiece(pieceToDelete.id);
                  setPieceToDelete(null);
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
