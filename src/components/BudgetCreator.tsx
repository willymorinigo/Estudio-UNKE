/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, DesignPiece, BudgetItem, Budget, BudgetStatus, Project, Payment, ProjectStatus } from '../types';
import { exportBudgetToPDF, formatCurrency } from '../pdfExport';
import { 
  FileText, Plus, Trash2, CheckCircle, Search, 
  ExternalLink, ArrowRight, Download, Eye, AlertCircle, RefreshCw, Sparkles,
  UserCheck, DollarSign, CreditCard, Calendar, X, Briefcase, CheckCircle2
} from 'lucide-react';

interface BudgetCreatorProps {
  clients: Client[];
  pieces: DesignPiece[];
  budgets: Budget[];
  projects?: Project[];
  onAddBudget: (budget: Budget) => void;
  onUpdateBudgetStatus: (id: string, status: BudgetStatus) => void;
  onDeleteBudget: (id: string) => void;
  onAddPayment?: (budgetId: string, payment: Payment) => void;
  onUpdateProject?: (project: Project) => void;
  initialTab?: 'create' | 'history';
  onTabChange?: (tab: 'create' | 'history') => void;
}

export default function BudgetCreator({
  clients,
  pieces,
  budgets,
  projects = [],
  onAddBudget,
  onUpdateBudgetStatus,
  onDeleteBudget,
  onAddPayment,
  onUpdateProject,
  initialTab = 'create',
  onTabChange
}: BudgetCreatorProps) {
  // Navigation & Lists
  const [activeTab, setActiveTab] = useState<'create' | 'history'>(initialTab);
  const [searchHistory, setSearchHistory] = useState('');

  // Sync activeTab if initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleSetTab = (tab: 'create' | 'history') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Selected budget details and interactive payment states
  const [detailedBudget, setDetailedBudget] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Transferencia Bancaria');
  const [payNotes, setPayNotes] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form states (Create Budget)
  const [selectedCategory, setSelectedCategory] = useState<'A' | 'B' | 'C'>('B');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [budgetNotes, setBudgetNotes] = useState('');
  const [draftItems, setDraftItems] = useState<BudgetItem[]>([]);
  
  // Quick item selector states
  const [selectedPieceId, setSelectedPieceId] = useState('');
  const [pieceQty, setPieceQty] = useState(1);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  const getCategoryMultiplier = (category: 'A' | 'B' | 'C') => {
    if (category === 'A') return 1.35;
    if (category === 'C') return 0.65;
    return 1.0;
  };

  const handleCategoryChange = (category: 'A' | 'B' | 'C') => {
    setSelectedCategory(category);
    
    // Recalculate any items in the draft that are present in the catalogue!
    const multiplier = getCategoryMultiplier(category);
    const updated = draftItems.map(item => {
      const parentPiece = pieces.find(p => p.id === item.id);
      if (parentPiece) {
        const newPrice = Math.round(parentPiece.price * multiplier);
        return {
          ...item,
          price: newPrice,
          subtotal: newPrice * item.quantity
        };
      }
      return item;
    });
    setDraftItems(updated);

    // If client does not match category, clear it to avoid mismatch
    const client = clients.find(c => c.id === selectedClientId);
    if (client && client.category !== category) {
      setSelectedClientId('');
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    
    const client = clients.find(c => c.id === clientId);
    if (client && client.category) {
      const cat = client.category as 'A' | 'B' | 'C';
      setSelectedCategory(cat);
      
      const multiplier = getCategoryMultiplier(cat);
      const updated = draftItems.map(item => {
        const parentPiece = pieces.find(p => p.id === item.id);
        if (parentPiece) {
          const newPrice = Math.round(parentPiece.price * multiplier);
          return {
            ...item,
            price: newPrice,
            subtotal: newPrice * item.quantity
          };
        }
        return item;
      });
      setDraftItems(updated);
    }
  };

  const handleAddItemFromCatalogue = () => {
    if (!selectedPieceId) return;
    const piece = pieces.find(p => p.id === selectedPieceId);
    if (!piece) return;

    const multiplier = getCategoryMultiplier(selectedCategory);
    const calculatedPrice = Math.round(piece.price * multiplier);

    // Check if ya exists in item draft list
    const existingIndex = draftItems.findIndex(i => i.id === piece.id);
    if (existingIndex > -1) {
      const updated = [...draftItems];
      updated[existingIndex].quantity += pieceQty;
      updated[existingIndex].price = calculatedPrice;
      updated[existingIndex].subtotal = calculatedPrice * updated[existingIndex].quantity;
      setDraftItems(updated);
    } else {
      const newItem: BudgetItem = {
        id: piece.id,
        name: piece.name,
        price: calculatedPrice,
        quantity: pieceQty,
        subtotal: calculatedPrice * pieceQty
      };
      setDraftItems([...draftItems, newItem]);
    }

    // Reset selector
    setSelectedPieceId('');
    setPieceQty(1);
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice) return;
    const priceNum = parseFloat(customItemPrice);
    if (isNaN(priceNum) || priceNum < 0) return;

    const newItem: BudgetItem = {
      id: `custom_${Date.now()}`,
      name: customItemName,
      price: priceNum,
      quantity: 1,
      subtotal: priceNum
    };

    setDraftItems([...draftItems, newItem]);
    setCustomItemName('');
    setCustomItemPrice('');
  };

  const removeItem = (index: number) => {
    const updated = [...draftItems];
    updated.splice(index, 1);
    setDraftItems(updated);
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...draftItems];
    updated[index].quantity = newQty;
    updated[index].subtotal = updated[index].price * newQty;
    setDraftItems(updated);
  };

  const totalBudgetCost = draftItems.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSubmitBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Por favor, selecciona o registra un cliente.');
      return;
    }
    if (draftItems.length === 0) {
      alert('La lista de ítems del presupuesto está vacía. Agrega al menos un componente o servicio pre-diseñado.');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    // Calculate dynamic sequential ID
    const year = new Date().getFullYear();
    const countOfYear = budgets.length + 1;
    const formattedId = `PP-${year}-${String(countOfYear).padStart(3, '0')}`;

    const newBudget: Budget = {
      id: formattedId,
      clientId: client.id,
      clientName: `${client.name} (${client.company || 'Estudio Particular'})`,
      date: new Date().toISOString().split('T')[0],
      items: draftItems,
      total: totalBudgetCost,
      notes: budgetNotes,
      status: 'Borrador',
      paymentStatus: 'Pendiente',
      payments: []
    };

    onAddBudget(newBudget);
    
    // Clear and redirect
    setDraftItems([]);
    setSelectedClientId('');
    setBudgetNotes('');
    handleSetTab('history');
  };

  // History budget matching / filters
  const filteredBudgets = budgets.filter(b => 
    b.id.toLowerCase().includes(searchHistory.toLowerCase()) ||
    b.clientName.toLowerCase().includes(searchHistory.toLowerCase()) ||
    b.status.toLowerCase().includes(searchHistory.toLowerCase())
  );

  const triggerPDFExport = (budget: Budget) => {
    const client = clients.find(c => c.id === budget.clientId);
    exportBudgetToPDF(budget, client);
  };

  const activeDetailedBudget = detailedBudget ? (budgets.find(b => b.id === detailedBudget.id) || detailedBudget) : null;
  const linkedProject = activeDetailedBudget ? projects.find(pr => pr.budgetId === activeDetailedBudget.id) : null;

  const handleAddPaymentToBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailedBudget || !onAddPayment || !payAmount) return;

    const parsedAmount = parseFloat(payAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: parsedAmount,
      method: payMethod,
      notes: payNotes.trim() || undefined
    };

    onAddPayment(activeDetailedBudget.id, newPayment);
    
    // Reset fields
    setPayAmount('');
    setPayNotes('');
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
    }, 3000);
  };

  const handleUpdateProjectStatusFromBudget = (newProjStatus: ProjectStatus) => {
    if (!linkedProject || !onUpdateProject) return;
    const updatedPrj: Project = {
      ...linkedProject,
      status: newProjStatus,
      endDate: newProjStatus === 'Completado' ? new Date().toISOString().split('T')[0] : undefined
    };
    onUpdateProject(updatedPrj);
  };

  return (
    <div className="space-y-6" id="budget-creator-section">
      
      {/* Header section with tabs selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#34877c]" />
            Módulo de Presupuestos Comerciales
          </h2>
          <p className="text-sm text-gray-500">
            Armador automático con piezas valorizadas en pesos y visor histórico.
          </p>
        </div>
        
        {/* Tab switch control */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => handleSetTab('create')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'create' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Nuevo Presupuesto Auto-calculable
          </button>
          <button
            onClick={() => handleSetTab('history')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'history' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Historial de Presupuestos
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleSubmitBudget} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 bg-[#34877c]/5 p-3 rounded-xl border border-[#34877c]/10 text-xs text-[#34877c] font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Este cotizador utiliza valores guardados en pesos del catálogo de UNKE para agilizar y confeccionar reportes de forma automatizada.</span>
          </div>

          {/* STEP 1: CLIENT AND CATEGORY SELECTION */}
          <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-extrabold text-[#34877c] uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Paso 1: Categoría de Tarifa y Destinatario
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Type Category Selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">1. Seleccionar Tipo/Categoría de Cliente *</label>
                <select
                  value={selectedCategory}
                  onChange={e => handleCategoryChange(e.target.value as 'A' | 'B' | 'C')}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-850 focus:outline-none focus:border-[#34877c] font-semibold"
                >
                  <option value="A">Categoría A: Grandes Empresas / Estado (Tarifa Base +35%)</option>
                  <option value="B">Categoría B: PyMEs / Base Estándar (Tarifa Lista)</option>
                  <option value="C">Categoría C: Particulares / ONGs (Tarifa Base -35%)</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Elegir primero para recargar o descontar los valores del catálogo automáticamente.</p>
              </div>

              {/* Link Client Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">2. Vincular a Cliente de esta Categoría *</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={e => handleClientChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-850 focus:outline-none focus:border-[#34877c] font-semibold"
                >
                  <option value="">-- Vincular cliente --</option>
                  {clients
                    .filter(c => c.category === selectedCategory)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company || 'Particular'})
                      </option>
                    ))
                  }
                  {clients.filter(c => c.category !== selectedCategory).length > 0 && (
                    <optgroup label="Clientes de otras categorías (cambiará selección)">
                      {clients
                        .filter(c => c.category !== selectedCategory)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.company || 'Particular'}) — Cat. {c.category || 'B'}
                          </option>
                        ))
                      }
                    </optgroup>
                  )}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Si seleccionas un cliente con otra categoría, se ajustará automáticamente.
                </p>
              </div>

            </div>

            {/* Displaying visual note indicator of fee active multiplier */}
            {selectedCategory === 'A' && (
              <div className="bg-amber-50/85 border border-amber-200/50 text-amber-900 rounded-xl p-3 text-[10.5px] leading-tight flex items-start gap-2">
                <span className="font-extrabold text-amber-800 shrink-0">💼 TARIFA CAT A (+35%):</span>
                <span>Se aplica recargo de +35% sobre precios base. Puedes editar los valores resultantes libremente en el borrador técnico de abajo.</span>
              </div>
            )}
            {selectedCategory === 'C' && (
              <div className="bg-emerald-50/85 border border-emerald-200/50 text-emerald-900 rounded-xl p-3 text-[10.5px] leading-tight flex items-start gap-2 font-semibold">
                <span className="font-extrabold text-[#34877c] shrink-0">🌱 TARIFA CAT C (-35%):</span>
                <span className="text-[#34877c]">Se aplica bonificación de -35% sobre precios base. Los valores resultantes se pueden editar individualmente en la tabla.</span>
              </div>
            )}
            {selectedCategory === 'B' && (
              <div className="bg-slate-100 border border-slate-200 text-slate-800 rounded-xl p-3 text-[10.5px] leading-tight flex items-start gap-2">
                <span className="font-extrabold text-slate-600 shrink-0">🏢 TARIFA CAT B (Lista):</span>
                <span className="text-gray-500 font-medium">Se aplica la tarifa de precio base estándar de catálogo de Estudio UNKE.</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT / MID: Editor list of items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hagamos el Detalle de Items</h4>
                
                {/* 1. Quick inclusion from preloaded products */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Opción A: Insertar desde Catálogo UNKE</span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedPieceId}
                      onChange={e => setSelectedPieceId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg text-xs p-2 flex-grow focus:outline-none"
                    >
                      <option value="">-- Seleccionar pieza de diseño pre-valorizada --</option>
                      {pieces.map(p => {
                        const multiplier = getCategoryMultiplier(selectedCategory);
                        const calculatedPrice = multiplier !== 1.0 ? Math.round(p.price * multiplier) : p.price;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(calculatedPrice)}{multiplier !== 1.0 ? ' con Tarifa' : ''})
                          </option>
                        );
                      })}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={pieceQty}
                        onChange={e => setPieceQty(parseInt(e.target.value) || 1)}
                        className="bg-white border border-slate-200 rounded-lg text-xs p-2 w-14 text-center focus:outline-none"
                        title="Cantidad"
                      />
                      <button
                        type="button"
                        onClick={handleAddItemFromCatalogue}
                        className="bg-[#34877c] hover:bg-[#2c7269] text-white text-xs px-3 rounded-lg font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Custom manual Item creation */}
                <div className="bg-slate-100/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Opción B: Insertar Item Ad-hoc / Particular</span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={customItemName}
                      onChange={e => setCustomItemName(e.target.value)}
                      placeholder="Ej. Hosting Web + Delegación de NIC.AR (1 año)"
                      className="bg-white border border-slate-200 rounded-lg text-xs p-2 flex-grow focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Monto en $"
                        value={customItemPrice}
                        onChange={e => setCustomItemPrice(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg text-xs p-2 w-28 text-center focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs px-3 rounded-lg font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar Manual
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table container */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detalle del Presupuesto</h4>
                {draftItems.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-gray-400 italic text-xs">
                    No se han cargado items en el borrador técnico de la cotización. Utiliza el selector de arriba para inyectar servicios.
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-gray-700 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="p-3">Item / Concepto Técnico</th>
                          <th className="p-3 text-right" style={{ width: '150px' }}>Precio Unitario ($)</th>
                          <th className="p-3 text-center">Cant.</th>
                          <th className="p-3 text-right">Subtotal</th>
                          <th className="p-3 text-center">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {draftItems.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-gray-800">{item.name}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1 font-mono">
                                <span className="text-gray-400 mr-0.5">$</span>
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={e => {
                                    const newPrice = Math.max(0, parseInt(e.target.value) || 0);
                                    const updated = [...draftItems];
                                    updated[index].price = newPrice;
                                    updated[index].subtotal = newPrice * updated[index].quantity;
                                    setDraftItems(updated);
                                  }}
                                  className="w-24 bg-slate-50 border border-slate-250 rounded-lg p-1 text-right text-xs focus:outline-none focus:border-[#34877c] font-semibold text-gray-800"
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(index, item.quantity - 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold"
                                >
                                  -
                                </button>
                                <span className="font-mono w-4 text-center text-xs font-bold">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(index, item.quantity + 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-gray-800">{formatCurrency(item.subtotal)}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-400 hover:text-red-600 p-1"
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

            {/* RIGHT SIDEBAR: Customer details and final save */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-slate-200 pb-2">Destinatario & Cierre</h4>
                
                {/* Selected Client Card Display */}
                {selectedClientId ? (() => {
                  const client = clients.find(c => c.id === selectedClientId);
                  if (!client) return null;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 relative">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Cliente Vinculado</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900">{client.name}</p>
                      {client.company && <p className="text-[10px] text-[#6f6f6e] font-semibold">{client.company}</p>}
                      <p className="text-[10px] text-gray-400 font-sans">Categoría {client.category || 'B'}</p>
                    </div>
                  );
                })() : (
                  <div className="bg-amber-100/50 border border-amber-200/30 rounded-xl p-3 text-[10px] text-amber-800 italic font-semibold">
                    No has vinculado ningún cliente todavía. Selecciona uno en el "Paso 1" de arriba.
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Notas Comerciales Especiales</label>
                  <textarea
                    rows={4}
                    value={budgetNotes}
                    onChange={e => setBudgetNotes(e.target.value)}
                    placeholder="Condiciones de pago, plazo estimado del proyecto, seña requerida o algún comentario de servicio..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none"
                  />
                </div>

                {/* Totals readout */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Cantidad de items:</span>
                    <span className="font-bold text-gray-800">{draftItems.reduce((acc, curr) => acc + curr.quantity, 0)}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-700 text-xs">Total final en pesos:</span>
                    <span className="text-base font-bold text-[#34877c] font-mono">{formatCurrency(totalBudgetCost)}</span>
                  </div>
                </div>

                {/* Trigger create and save buttons */}
                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full bg-[#34877c] hover:bg-[#2c7269] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Guardar como Borrador
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedClientId) {
                        alert('Selecciona un cliente antes de simular o descargar el PDF.');
                        return;
                      }
                      if (draftItems.length === 0) {
                        alert('Por favor inyecta items para generar la simulación PDF.');
                        return;
                      }
                      
                      const simulatedClient = clients.find(c => c.id === selectedClientId);
                      const simulatedBudget: Budget = {
                        id: 'PP-BORRADOR',
                        clientId: selectedClientId,
                        clientName: simulatedClient ? `${simulatedClient.name} (${simulatedClient.company || ''})` : 'Cliente de Prueba',
                        date: new Date().toISOString().split('T')[0],
                        items: draftItems,
                        total: totalBudgetCost,
                        notes: budgetNotes,
                        status: 'Borrador',
                        paymentStatus: 'Pendiente',
                        payments: []
                      };
                      triggerPDFExport(simulatedBudget);
                    }}
                    className="w-full border border-slate-200 hover:bg-slate-100 text-gray-700 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Previsualizar PDF Comercial
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      ) : (
        /* HISTORY TAB (Managing budget history & searches) */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4" id="budget-history-container">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Base de Datos de Presupuestos Emitidos</span>
              <h3 className="font-bold text-gray-900 text-sm">Historial de Presupuestos</h3>
            </div>
            
            {/* Search History bar */}
            <div className="relative w-full sm:w-72">
              <input
                id="search-budget-history-input"
                type="text"
                placeholder="Buscar por ID, Cliente o Estado..."
                value={searchHistory}
                onChange={e => setSearchHistory(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-gray-800 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">Código ID</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Cliente / Proyecto</th>
                  <th className="p-3 text-right">Monto Total</th>
                  <th className="p-3 text-center">Estado Comercial</th>
                  <th className="p-3 text-center">Facturación</th>
                  <th className="p-3 text-center">Acciones y Exportación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredBudgets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 italic">
                      No se encontraron presupuestos emitidos.
                    </td>
                  </tr>
                ) : (
                  filteredBudgets.map(budget => {
                    const totalPaid = budget.payments.reduce((sum, p) => sum + p.amount, 0);
                    return (
                      <tr key={budget.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                        <td 
                          onClick={() => setDetailedBudget(budget)}
                          className="p-3 font-mono font-bold text-[#34877c] cursor-pointer hover:underline"
                          title="Haga clic para ver el detalle de este presupuesto"
                        >
                          {budget.id}
                        </td>
                        <td 
                          onClick={() => setDetailedBudget(budget)}
                          className="p-3 font-mono text-gray-500 cursor-pointer"
                          title="Haga clic para ver el detalle de este presupuesto"
                        >
                          {budget.date}
                        </td>
                        <td 
                          onClick={() => setDetailedBudget(budget)}
                          className="p-3 text-gray-700 cursor-pointer"
                          title="Haga clic para ver el detalle de este presupuesto"
                        >
                          <p className="font-semibold text-gray-950 hover:text-[#34877c] transition-colors">{budget.clientName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {budget.createdBy && (
                              <span className="text-[8px] bg-slate-100 text-gray-600 font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                                🧑‍💻 {budget.createdBy}
                              </span>
                            )}
                            {budget.updatedBy && budget.updatedBy !== budget.createdBy && (
                              <span className="text-[8px] bg-[#34877c]/10 text-[#34877c] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                                ✏️ {budget.updatedBy}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate max-w-xs mt-1">{budget.notes || 'Sin observaciones'}</p>
                        </td>
                        <td 
                          onClick={() => setDetailedBudget(budget)}
                          className="p-3 text-right font-mono font-bold text-gray-800 cursor-pointer"
                          title="Haga clic para ver el detalle de este presupuesto"
                        >
                          {formatCurrency(budget.total)}
                        </td>
                        
                        {/* Interactive state pickers */}
                        <td className="p-3 text-center">
                          <select
                            value={budget.status}
                            onChange={e => onUpdateBudgetStatus(budget.id, e.target.value as BudgetStatus)}
                            className={`text-[10px] font-bold p-1 rounded border capitalize focus:outline-none ${
                              budget.status === 'Aprobado' 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                : budget.status === 'Borrador'
                                ? 'bg-slate-100 text-slate-800 border-slate-200'
                                : budget.status === 'Enviado'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}
                          >
                            <option value="Borrador">Borrador</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Aprobado">Aprobado ✓</option>
                            <option value="Rechazado">Rechazado</option>
                          </select>
                        </td>

                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                            budget.paymentStatus === 'Completo' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : budget.paymentStatus === 'Parcial' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            {budget.paymentStatus === 'Completo' ? 'Saldado' : budget.paymentStatus === 'Parcial' ? 'Pago Parcial' : 'Impago'}
                          </span>
                          {budget.paymentStatus === 'Parcial' && (
                            <p className="text-[9px] text-gray-400 font-mono mt-0.5">Falta: {formatCurrency(budget.total - totalPaid)}</p>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setDetailedBudget(budget);
                              }}
                              className="bg-[#34877c]/10 hover:bg-[#34877c]/20 text-[#34877c] p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold transition"
                              title="Ver detalle y administrar pagos"
                            >
                              <Eye className="w-3 h-3" /> Ver / Registrar Pagos
                            </button>
                            <button
                              onClick={() => triggerPDFExport(budget)}
                              className="bg-[#34877c] hover:bg-[#2c7269] text-white p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold shadow-sm transition"
                              title="Descargar presupuesto PDF"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </button>
                            <button
                              onClick={() => {
                                setBudgetToDelete(budget.id);
                              }}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Remover presupuesto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-1.5 bg-yellow-50 text-yellow-800 p-3 rounded-xl text-[11px] border border-yellow-100 leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0 text-yellow-600 mt-0.5" />
            <p>
              <strong>automatización Inteligente de Flujos:</strong> Al cambiar cualquier estado de presupuesto comercial a <span className="font-bold">"Aprobado"</span>, el sistema UNKE creará de manera automática un proyecto de marca correspondiente en la sección de "Proyectos Activos", cargando además el checklist de tareas recomendadas para que no pierdas tiempo clonando de forma manual.
            </p>
          </div>

         </div>
      )}

      {/* 4. MODAL DETALLE DE PRESUPUESTO & CONTROL DE PAGOS / PROGRESO */}
      {activeDetailedBudget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" id="detailed-budget-modal">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto text-xs text-gray-700 animate-in fade-in zoom-in duration-150">
             {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <span className="text-[10px] bg-[#34877c]/10 text-[#34877c] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Ficha Técnica de Presupuesto
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">Presupuesto {activeDetailedBudget.id}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerPDFExport(activeDetailedBudget)}
                  className="bg-[#34877c] hover:bg-[#2c7269] text-white py-1.5 px-3.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
                  title="Descargar presupuesto actual en formato PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </button>
                <button
                  onClick={() => setDetailedBudget(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* general information banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block">Cliente</span>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">{activeDetailedBudget.clientName}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Emisión: {activeDetailedBudget.date}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block">Estado Comercial</span>
                  <div className="mt-1">
                    <select
                      value={activeDetailedBudget.status}
                      onChange={e => onUpdateBudgetStatus(activeDetailedBudget.id, e.target.value as BudgetStatus)}
                      className={`text-[11px] font-bold py-1 px-2.5 rounded border capitalize focus:outline-none ${
                        activeDetailedBudget.status === 'Aprobado' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : activeDetailedBudget.status === 'Borrador'
                          ? 'bg-slate-100 text-slate-800 border-slate-200'
                          : activeDetailedBudget.status === 'Enviado'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Aprobado">Aprobado ✓</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block">Total Cotizado</span>
                  <p className="text-base font-black text-gray-900 mt-0.5">{formatCurrency(activeDetailedBudget.total)}</p>
                </div>
              </div>

              {/* Items Table details */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Detalle del Servicio</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-semibold text-gray-700 border-b border-slate-100">
                      <tr>
                        <th className="p-2.5 pl-4">Ítem / Concepto</th>
                        <th className="p-2.5 text-center">Cantidad</th>
                        <th className="p-2.5 text-right">Precio Unitario</th>
                        <th className="p-2.5 text-right pr-4">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeDetailedBudget.items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/20 font-sans">
                          <td className="p-2.5 pl-4 font-medium text-gray-800">{item.name}</td>
                          <td className="p-2.5 text-center font-mono text-gray-500">{item.quantity}</td>
                          <td className="p-2.5 text-right font-mono text-gray-600">{formatCurrency(item.price)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-gray-800 pr-4">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/50 font-bold border-t border-slate-100">
                        <td colSpan={3} className="p-3 pl-4 text-right text-gray-500 text-[11px]">Subtotal del Trabajo:</td>
                        <td className="p-3 text-right text-[#34877c] text-sm pr-4 font-black">{formatCurrency(activeDetailedBudget.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {activeDetailedBudget.notes && (
                  <p className="text-[11px] text-gray-500 italic bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/50 mt-2">
                    💬 Observaciones: {activeDetailedBudget.notes}
                  </p>
                )}
              </div>

              {/* INTEGRACIÓN CON PROGRESOS (PROYECTOS) */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#34877c]" /> 
                  Sincronización Operativa de Progreso
                </h4>
                {activeDetailedBudget.status !== 'Aprobado' ? (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-gray-500 text-[11px] leading-relaxed">
                    ⚙️ El progreso técnico en la carpeta de producción se lanzará automáticamente una vez que cambies el estado de comercialización de este presupuesto a <span className="font-bold text-[#34877c]">"Aprobado ✓"</span>.
                  </div>
                ) : linkedProject ? (
                  <div className="bg-slate-50/80 p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-grow">
                      <p className="font-semibold text-gray-800">
                        Proyecto en curso: <span className="text-[#34877c]">{linkedProject.name}</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Fecha de inicio: {linkedProject.startDate}</span>
                        <span>•</span>
                        <span>
                          Checklist: {linkedProject.tasks.filter(t => t.completed).length}/{linkedProject.tasks.length} completado
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      {(() => {
                        const total = linkedProject.tasks.length;
                        const done = linkedProject.tasks.filter(t => t.completed).length;
                        const pctPrg = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <div className="w-full max-w-xs space-y-1 mt-2">
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${pctPrg}%` }}></div>
                            </div>
                            <span className="text-[9px] font-semibold text-teal-600 font-mono block">{pctPrg}% Completado</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Progreso actual:</span>
                      <select
                        value={linkedProject.status}
                        onChange={e => handleUpdateProjectStatusFromBudget(e.target.value as ProjectStatus)}
                        className="bg-white border border-slate-200 rounded-lg text-xs font-bold p-1 w-32 focus:outline-none"
                      >
                        <option value="Planificado">Planificado</option>
                        <option value="En Progreso">En Progreso</option>
                        <option value="En Revision">En Revisión</option>
                        <option value="Completado">Completado</option>
                        <option value="Pausado">Pausado</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-[11px] border border-amber-100 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>No se encontró una carpeta de proyecto asignada a este código ID en la nube.</span>
                  </div>
                )}
              </div>

              {/* CONTROL DE PAGOS Y FACTURACIÓN */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#34877c]" /> 
                    Monitoreo y Registro de Pagos
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    activeDetailedBudget.paymentStatus === 'Completo' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : activeDetailedBudget.paymentStatus === 'Parcial' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-rose-50 text-rose-600'
                  }`}>
                    {activeDetailedBudget.paymentStatus === 'Completo' ? 'Saldado' : activeDetailedBudget.paymentStatus === 'Parcial' ? 'Pago Parcial' : 'Impago'}
                  </span>
                </div>

                {/* Grid representing payment numbers */}
                {(() => {
                  const paidSum = activeDetailedBudget.payments ? activeDetailedBudget.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
                  const rem = activeDetailedBudget.total - paidSum;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                      <div className="p-2.5 bg-slate-50 border rounded-xl">
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Cotización Total</span>
                        <span className="text-sm font-bold text-gray-800">{formatCurrency(activeDetailedBudget.total)}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                        <span className="text-[9px] text-emerald-600 font-bold uppercase block">Acreditado</span>
                        <span className="text-sm font-bold text-emerald-700">{formatCurrency(paidSum)}</span>
                      </div>
                      <div className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl">
                        <span className="text-[9px] text-rose-600 font-bold uppercase block">Saldo Pendiente</span>
                        <span className="text-sm font-bold text-rose-700">{formatCurrency(rem > 0 ? rem : 0)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Form to submit a new payment directly to this budget */}
                {activeDetailedBudget.status === 'Aprobado' || activeDetailedBudget.status === 'Enviado' || (activeDetailedBudget.payments && activeDetailedBudget.payments.length > 0) ? (
                  <form onSubmit={handleAddPaymentToBudget} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                    <h5 className="font-bold text-gray-900 text-xs flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#34877c]" /> Cargar Nuevo Pago para {activeDetailedBudget.id}
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-0.5">Monto de Entrega (en $)</label>
                        <input
                          type="number"
                          required
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          placeholder="Ej. 15000"
                          className="bg-white border border-slate-200 rounded-lg text-xs p-1.5 w-full focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-0.5">Vía / Canal de Pago</label>
                        <select
                          value={payMethod}
                          onChange={e => setPayMethod(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg text-xs p-1.5 w-full focus:outline-none"
                        >
                          <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                          <option value="Mercado Pago">Mercado Pago</option>
                          <option value="Efectivo ARS">Efectivo ARS</option>
                          <option value="Cheque / Otro">Cheque / Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-0.5">Observación / Etiqueta</label>
                        <input
                          type="text"
                          value={payNotes}
                          onChange={e => setPayNotes(e.target.value)}
                          placeholder="Ej. Seña de Kickoff, 2da cuota"
                          className="bg-white border border-slate-200 rounded-lg text-xs p-1.5 w-full focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                      <div>
                        {paymentSuccess && <span className="text-emerald-600 font-bold animate-pulse">✓ Pago procesado y acreditado con éxito.</span>}
                      </div>
                      <button
                        type="submit"
                        className="bg-[#34877c] hover:bg-[#2c7269] text-white rounded-lg px-4 py-1.5 font-bold transition flex items-center gap-1 text-[11px]"
                      >
                        <Plus className="w-3.5 h-3.5" /> Acreditar Transacción
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-[11px] border border-amber-100">
                    ⚠️ Solo se pueden registrar pagos en presupuestos aprobados oficialmente para evitar descuadres en los balances de los socios.
                  </div>
                )}

                {/* historic receipts */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide block">Historial de Cobros Recibidos</span>
                  {!activeDetailedBudget.payments || activeDetailedBudget.payments.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic">No se han registrado entregas monetarias para este presupuesto.</p>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {activeDetailedBudget.payments.map((p) => {
                        return (
                          <div key={p.id} className="p-2.5 hover:bg-slate-50/50 flex justify-between items-center text-xs">
                            <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 text-slate-500">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">{p.date}</span>
                              <span className="font-medium text-slate-700">{p.method}</span>
                              {p.notes && <span className="italic">"{p.notes}"</span>}
                            </div>
                            <span className="font-mono font-bold text-emerald-600">+{formatCurrency(p.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center z-10 text-[11px]">
              <span className="text-gray-400 italic">
                Última edición técnica: {activeDetailedBudget.updatedAt ? new Date(activeDetailedBudget.updatedAt).toLocaleDateString() : 'Desconocida'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBudgetToDelete(activeDetailedBudget.id);
                    setDetailedBudget(null);
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5"
                  title="Eliminar este presupuesto permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar Presupuesto
                </button>
                <button
                  type="button"
                  onClick={() => setDetailedBudget(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-xl font-bold transition"
                >
                  Cerrar Panel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE PRESUPUESTO CO-OPERATIVO */}
      {budgetToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 text-xs text-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="bg-red-50 p-2 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">¿Eliminar Presupuesto?</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar el registro comercial de cotización <strong className="text-slate-900">{budgetToDelete}</strong>? Esta acción borrará permanentemente el presupuesto de la base de datos de los socios.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBudget(budgetToDelete);
                  setBudgetToDelete(null);
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
