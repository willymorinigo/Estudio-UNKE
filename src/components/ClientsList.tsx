/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, Payment, Budget } from '../types';
import { formatCurrency } from '../pdfExport';
import { 
  Users, Plus, Search, Mail, Phone, MapPin, 
  Globe, Key, Eye, EyeOff, Clipboard, CreditCard, 
  History, DollarSign, Calendar, Trash2, Edit2, CheckCircle2,
  AlertCircle, RefreshCw
} from 'lucide-react';

interface ClientsListProps {
  clients: Client[];
  budgets: Budget[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onAddPayment: (budgetId: string, payment: Payment) => void;
}

export default function ClientsList({
  clients,
  budgets,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddPayment
}: ClientsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'A' | 'B' | 'C'>('B');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [hasWebServices, setHasWebServices] = useState(false);
  const [webUrl, setWebUrl] = useState('');
  const [webUser, setWebUser] = useState('');
  const [webPass, setWebPass] = useState('');
  const [webHosting, setWebHosting] = useState('');
  const [webNotes, setWebNotes] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // New Payment state
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);
  const [payBudgetId, setPayBudgetId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Transferencia Bancaria');
  const [payNotes, setPayNotes] = useState('');

  // Filtering
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientBudgets = (clientId: string) => {
    return budgets.filter(b => b.clientId === clientId);
  };

  const getClientFinancials = (clientId: string) => {
    const clientBudgets = getClientBudgets(clientId).filter(b => b.status === 'Aprobado' || (b.payments && b.payments.length > 0));
    let totalBudgeted = clientBudgets.reduce((sum, b) => sum + b.total, 0);
    let totalPaid = clientBudgets.reduce((sum, b) => {
      const pList = b.payments || [];
      const budgetPaid = pList.reduce((pSum, p) => pSum + p.amount, 0);
      return sum + budgetPaid;
    }, 0);
    return {
      totalBudgeted,
      totalPaid,
      pending: totalBudgeted - totalPaid
    };
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setErrorMsg(null);

    const updatedClientData: Client = {
      id: isEditing && selectedClient ? selectedClient.id : `cli_${Date.now()}`,
      name,
      category,
      company,
      email,
      phone,
      address,
      notes,
      hasWebServices,
      webData: hasWebServices ? {
        url: webUrl,
        username: webUser,
        password: webPass,
        hostingInfo: webHosting,
        notes: webNotes
      } : {},
      createdAt: isEditing && selectedClient ? selectedClient.createdAt : new Date().toISOString().split('T')[0]
    };

    try {
      if (isEditing) {
        await onUpdateClient(updatedClientData);
        setSelectedClient(updatedClientData);
      } else {
        await onAddClient(updatedClientData);
      }
      // Reset and close only on successful integration
      resetForm();
    } catch (err: any) {
      console.error("Error al registrar dador/cliente:", err);
      setErrorMsg(`Error de conexión o permisos: ${err.message || err}. Asegúrese de que la base de datos de Firestore esté online y configurada.`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setIsEditing(false);
    setErrorMsg(null);
    setName('');
    setCategory('B');
    setCompany('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setHasWebServices(false);
    setWebUrl('');
    setWebUser('');
    setWebPass('');
    setWebHosting('');
    setWebNotes('');
  };

  const startEdit = (client: Client) => {
    setName(client.name);
    setCategory(client.category || 'B');
    setCompany(client.company);
    setEmail(client.email);
    setPhone(client.phone);
    setAddress(client.address || '');
    setNotes(client.notes || '');
    setHasWebServices(client.hasWebServices);
    if (client.hasWebServices && client.webData) {
      setWebUrl(client.webData.url || '');
      setWebUser(client.webData.username || '');
      setWebPass(client.webData.password || '');
      setWebHosting(client.webData.hostingInfo || '');
      setWebNotes(client.webData.notes || '');
    } else {
      setWebUrl('');
      setWebUser('');
      setWebPass('');
      setWebHosting('');
      setWebNotes('');
    }
    setIsEditing(true);
    setIsAdding(true);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount);
    if (!payBudgetId || isNaN(amountNum) || amountNum <= 0) return;

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: amountNum,
      method: payMethod,
      notes: payNotes
    };

    onAddPayment(payBudgetId, newPayment);
    
    // Close & reset
    setIsLoggingPayment(false);
    setPayAmount('');
    setPayNotes('');
    // Refresh local client views
    if (selectedClient) {
      // Small trigger to force refresh
      const u = clients.find(c => c.id === selectedClient.id);
      if (u) setSelectedClient(u);
    }
  };

  return (
    <div className="space-y-6" id="unke-clients-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#34877c]" />
            Administrador de Clientes
          </h2>
          <p className="text-sm text-gray-500">Gestión de contactos, credenciales web y reportes de pagos parciales.</p>
        </div>
        <button
          id="btn-add-client-toggle"
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="bg-[#34877c] hover:bg-[#2c7269] text-white py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {isAdding && (
        <div id="modal-client-form" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {isEditing ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente'}
          </h3>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 text-rose-900 text-xs font-semibold mb-4">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold">Fallo de Escritura en Base de Datos (Firestore)</p>
                <p className="font-normal text-[11px] text-rose-700 leading-normal">{errorMsg}</p>
                <p className="font-normal text-[10px] text-gray-400 italic">Los datos ingresados siguen cargados abajo para que no los pierdas.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 bg-[#f8fafb] border border-gray-100 p-4 rounded-2xl space-y-1">
                <label className="block text-xs font-bold text-[#34877c] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>🏷️ Categoría de Cliente & Tarifa Asociada</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as 'A' | 'B' | 'C')}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#34877c] font-semibold"
                >
                  <option value="A">Cliente A: Estado / Empresas o instituciones con 70 empleados o más (Tarifa Base + 35%)</option>
                  <option value="B">Cliente B: PyMEs / Instituciones con menos de 70 empleados (Tarifa de Lista / Base)</option>
                  <option value="C">Cliente C: Sin fines de lucro / Particulares / Profesionales independientes (Tarifa Base - 35%)</option>
                </select>
                <p className="text-[10px] text-gray-400 font-sans italic pt-0.5">
                  El Estudio aplicará automáticamente los coeficientes a las nuevas cotizaciones para este cliente: Cat. A (+35%), Cat. B (Base), Cat. C (-35%).
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre Completo del Contacto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Empresa / Razón Social</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Ej. Mandarina Café"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ej. juan@empresa.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej. +54 9 341 555-5555"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ej. Bv. Oroño 1234, Rosario, Santa Fe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Notas generales sobre de la marca</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Anotaciones de marca, estilo de diseño requerido, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                />
              </div>
            </div>

            {/* Toggle Web Credentials Options */}
            <div className="border-t border-slate-100 pt-4">
              <label className="relative flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasWebServices}
                  onChange={e => setHasWebServices(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34877c]"></div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">¿Requiere Datos de Acceso Web?</span>
                  <p className="text-xs text-gray-500">Activa esta opción para registrar credenciales de hosting, WordPress, ftp o base de datos.</p>
                </div>
              </label>

              {hasWebServices && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                  <div className="md:col-span-2">
                    <h4 className="text-xs font-bold text-[#34877c] uppercase tracking-wider flex items-center gap-1 mb-2">
                      <Globe className="w-3.5 h-3.5" /> Datos del Sitio Web & Servidor
                    </h4>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">URL del Sitio</label>
                    <input
                      type="text"
                      value={webUrl}
                      onChange={e => setWebUrl(e.target.value)}
                      placeholder="Ej. https://mandarinacafe.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Usuario de Acceso</label>
                    <input
                      type="text"
                      value={webUser}
                      onChange={e => setWebUser(e.target.value)}
                      placeholder="Ej. admin@cafe.com (o admin)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Contraseña de Acceso</label>
                    <input
                      type="text"
                      value={webPass}
                      onChange={e => setWebPass(e.target.value)}
                      placeholder="Ej. P@ssw0rdUNKE"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Datos de Hosting / Proveedor</label>
                    <input
                      type="text"
                      value={webHosting}
                      onChange={e => setWebHosting(e.target.value)}
                      placeholder="Ej. DonWeb - Servidor CloudVPS 1"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Notas de Servidores / CMS</label>
                    <input
                      type="text"
                      value={webNotes}
                      onChange={e => setWebNotes(e.target.value)}
                      placeholder="Ej. Wordpress v6 - Plugins activos: WooCommerce y Stripe"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-[#34877c] hover:bg-[#2c7269] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  isEditing ? 'Guardar Cambios' : 'Registrar Cliente'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main client grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Clients search and list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              Búsqueda de Clientes
            </h3>
            <div className="relative">
              <input
                id="search-clients-input"
                type="text"
                placeholder="Buscar por cliente o empresa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#34877c]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
            </div>

            <div className="space-y-2 mt-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 italic">No se hallaron clientes.</p>
                </div>
              ) : (
                filteredClients.map(client => {
                  const financials = getClientFinancials(client.id);
                  const isSelected = selectedClient?.id === client.id;
                  
                  // Calculate dynamic visual payment percentage
                  const pctPaid = financials.totalBudgeted > 0 
                    ? Math.min(100, Math.round((financials.totalPaid / financials.totalBudgeted) * 100))
                    : 0;

                  return (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                        isSelected 
                          ? 'bg-slate-50 border-[#34877c] ring-1 ring-[#34877c]/20' 
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-bold text-xs text-gray-800">{client.name}</span>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {client.hasWebServices && (
                            <span className="text-[8px] bg-[#34877c]/10 text-[#34877c] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Globe className="w-2.5 h-2.5" /> Web
                            </span>
                          )}
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm select-none ${
                            client.category === 'A' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200/20' 
                              : client.category === 'C' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/20' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200/20'
                          }`}>
                            CAT {client.category || 'B'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mb-2">{client.company || 'Estudio Particular'}</p>

                      {/* Display pricing overview on lists to directly show payment totals */}
                      {financials.totalBudgeted > 0 ? (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-500">Cobrado: {formatCurrency(financials.totalPaid)}</span>
                            <span className="font-bold text-[#34877c]">{pctPaid}%</span>
                          </div>
                          
                          {/* visual progress tracker */}
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                pctPaid === 100 ? 'bg-emerald-500' : pctPaid > 0 ? 'bg-amber-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${pctPaid}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between text-[8.5px] text-gray-400">
                            <span>Total: {formatCurrency(financials.totalBudgeted)}</span>
                            {financials.pending > 0 && <span className="text-red-500 font-semibold">Pendiente: {formatCurrency(financials.pending)}</span>}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] text-gray-400 italic">Sin presupuestos aprobados</p>
                      )}

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100/60">
                        <span className="text-[9px] text-gray-400 font-mono">ID: {client.id.replace('cli_', '')}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClientToDelete(client);
                          }}
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: Selected Client Sheet ("Ficha de Cliente de UNKE") */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" id="selected-client-sheet">
              
              {/* Client header banner */}
              <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-gray-100 flex justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ficha de Cliente de Diseño</span>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight mt-1">{selectedClient.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-[#34877c]">{selectedClient.company || 'Estudio Particular'}</p>
                    {(() => {
                      const cat = selectedClient.category || 'B';
                      if (cat === 'A') {
                        return (
                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/50 font-black px-2 py-0.5 rounded-full select-none" title="Estado / Grandes Empresas o instituciones (+35%)">
                            Categoría A (+35% s/ Base)
                          </span>
                        );
                      }
                      if (cat === 'C') {
                        return (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/50 font-black px-2 py-0.5 rounded-full select-none" title="Instituciones sin fines de lucro / Particulares / Profesionales (-35%)">
                            Categoría C (-35% s/ Base)
                          </span>
                        );
                      }
                      return (
                        <span className="text-[9px] bg-slate-50 text-slate-600 border border-slate-200/50 font-black px-2 py-0.5 rounded-full select-none" title="PyMEs / Instituciones con menos de 70 empleados (Precio Base)">
                          Categoría B (Precio Lista)
                        </span>
                      );
                    })()}
                  </div>
                  
                  {selectedClient.createdBy && (
                    <p className="text-[9px] text-gray-400 mt-2 uppercase font-semibold tracking-wider">
                      Registrado por: <span className="font-bold text-gray-600">{selectedClient.createdBy}</span>
                      {selectedClient.updatedBy && (
                        <span> • Modificado por: <span className="font-bold text-gray-600">{selectedClient.updatedBy}</span></span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(selectedClient)}
                    className="p-2 border border-slate-200 text-gray-600 rounded-lg hover:bg-slate-100 text-xs transition"
                    title="Editar cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setClientToDelete(selectedClient);
                    }}
                    className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs transition"
                    title="Eliminar cliente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* 1. Contact and general info row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Información de Contacto</h4>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{selectedClient.email || 'Sin correo electrónico'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{selectedClient.phone || 'Sin número de contacto'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{selectedClient.address || 'Sin dirección registrada'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>Miembro desde: {selectedClient.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Observaciones Generales</h4>
                    <p className="text-xs text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed min-h-[75px]">
                      {selectedClient.notes || 'Sin anotaciones particulares.'}
                    </p>
                  </div>
                </div>

                {/* 2. Web Access & Credentials Section (Requested custom credential container) */}
                {selectedClient.hasWebServices && selectedClient.webData ? (
                  <div className="bg-slate-50 border border-[#34877c]/20 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-[#34877c] uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-4 h-4" /> credenciales web y accesos administrados
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono">Tipo: Usuario y Contraseña Web</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase">URL del sitio</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {selectedClient.webData.url ? (
                            <a 
                              href={selectedClient.webData.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[#34877c] hover:underline font-mono truncate"
                            >
                              {selectedClient.webData.url}
                            </a>
                          ) : (
                            <span className="text-gray-400">No especificado</span>
                          )}
                          {selectedClient.webData.url && (
                            <button 
                              onClick={() => copyToClipboard(selectedClient.webData?.url || '', 'url')}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-slate-200"
                              title="Copiar URL"
                            >
                              {copiedField === 'url' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase">Proveedor / Hosting</div>
                        <p className="font-mono text-gray-800 mt-1">{selectedClient.webData.hostingInfo || 'No especificado'}</p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <div className="text-[9px] font-semibold text-gray-500 uppercase">Usuario / Email de Acceso</div>
                          <p className="font-mono text-gray-800 text-xs truncate max-w-[170px]" title={selectedClient.webData.username}>
                            {selectedClient.webData.username || 'No especificado'}
                          </p>
                        </div>
                        {selectedClient.webData.username && (
                          <button 
                            onClick={() => copyToClipboard(selectedClient.webData?.username || '', 'user')}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-slate-100"
                            title="Copiar usuario"
                          >
                            {copiedField === 'user' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <div className="text-[9px] font-semibold text-gray-500 uppercase">Contraseña</div>
                          <p className="font-mono text-gray-800 text-xs">
                            {showPassword ? (selectedClient.webData.password || 'Vacio') : '••••••••••••'}
                          </p>
                        </div>
                        <div className="flex gap-0.5">
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-slate-100"
                            title={showPassword ? 'Ocultar contraseña' : 'Revelar contraseña'}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          {selectedClient.webData.password && (
                            <button 
                              onClick={() => copyToClipboard(selectedClient.webData?.password || '', 'pass')}
                              className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-slate-100"
                              title="Copiar contraseña"
                            >
                              {copiedField === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedClient.webData.notes && (
                        <div className="md:col-span-2 bg-white/50 border border-slate-200/50 p-2.5 rounded-xl text-[11px] leading-relaxed">
                          <span className="font-semibold text-gray-500 block text-[9px] uppercase">Anotaciones del Sistema:</span>
                          {selectedClient.webData.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100/50 border border-slate-100 text-center rounded-2xl">
                    <p className="text-xs text-gray-500 italic">Este cliente no posee requerimientos de servicios web directos, ni credenciales asociadas.</p>
                  </div>
                )}

                {/* 3. Financial overview status & payments logs */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <CreditCard className="w-4 h-4" /> Estado de Pago sobre lo Presupuestado
                    </h4>
                    {getClientBudgets(selectedClient.id).filter(b => b.status === 'Aprobado' || (b.payments && b.payments.length > 0)).length > 0 && (
                      <button
                        onClick={() => {
                          const approvedBudgets = getClientBudgets(selectedClient.id).filter(b => (b.status === 'Aprobado' || (b.payments && b.payments.length > 0)) && b.paymentStatus !== 'Completo');
                          if (approvedBudgets.length > 0) {
                            setPayBudgetId(approvedBudgets[0].id);
                          } else {
                            setPayBudgetId('');
                          }
                          setIsLoggingPayment(true);
                        }}
                        className="text-xs font-semibold text-[#34877c] hover:text-[#2c7269] flex items-center gap-1 bg-[#34877c]/10 px-2.5 py-1 rounded-lg"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Registrar Entrega/Pago
                      </button>
                    )}
                  </div>

                  {/* Payment form */}
                  {isLoggingPayment && (
                    <form onSubmit={handlePaySubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <h5 className="text-xs font-bold text-gray-800">Cargar Pago Parcial / Total</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 font-bold mb-0.5">Vincular a Presupuesto</label>
                          <select
                            value={payBudgetId}
                            onChange={e => setPayBudgetId(e.target.value)}
                            required
                            className="bg-white border border-slate-200 rounded-lg text-xs p-1.5 w-full focus:outline-none"
                          >
                            <option value="">-- Elegir Presupuesto Activo --</option>
                            {getClientBudgets(selectedClient.id)
                              .filter(b => b.status === 'Aprobado' || (b.payments && b.payments.length > 0))
                              .map(b => (
                                <option key={b.id} value={b.id}>
                                  {b.id} ({formatCurrency(b.total)})
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 font-bold mb-0.5">Monto del Pago (en $)</label>
                          <input
                            type="number"
                            required
                            value={payAmount}
                            onChange={e => setPayAmount(e.target.value)}
                            placeholder="Monto en pesos"
                            className="bg-white border border-slate-200 rounded-lg text-xs p-1.5 w-full focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 font-bold mb-0.5">Método de Pago</label>
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
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-0.5">Observación / Concepto</label>
                        <input
                          type="text"
                          value={payNotes}
                          onChange={e => setPayNotes(e.target.value)}
                          placeholder="Ej. Seña del 50%, segundo cobro, pago de contado."
                          className="bg-white border border-slate-200 rounded-lg text-xs p-1.5 w-full focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => { setIsLoggingPayment(false); }}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-gray-600 rounded-lg font-semibold hover:bg-slate-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-[#34877c] text-white rounded-lg font-semibold hover:bg-[#2c7269]"
                        >
                          Confirmar Pago
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Financial calculations */}
                  {(() => {
                    const financials = getClientFinancials(selectedClient.id);
                    const listApproved = getClientBudgets(selectedClient.id).filter(b => b.status === 'Aprobado' || (b.payments && b.payments.length > 0));
                    
                    if (listApproved.length === 0) {
                      return (
                        <div className="text-center py-4 text-xs text-gray-400 italic">
                          No posee presupuestos activos para monitorear estados de pago.
                        </div>
                      );
                    }

                    const pct = financials.totalBudgeted > 0 
                      ? Math.round((financials.totalPaid / financials.totalBudgeted) * 100) 
                      : 0;

                    const allPayments: {pay: Payment; budId: string}[] = [];
                    listApproved.forEach(b => {
                      b.payments.forEach(p => {
                        allPayments.push({ pay: p, budId: b.id });
                      });
                    });

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Presupuestado</span>
                            <span className="text-base font-bold text-gray-800">{formatCurrency(financials.totalBudgeted)}</span>
                          </div>
                          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase block">Montos Recaudados</span>
                            <span className="text-base font-bold text-emerald-700">{formatCurrency(financials.totalPaid)}</span>
                          </div>
                          <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                            <span className="text-[10px] font-bold text-rose-600 uppercase block">Saldo Pendiente</span>
                            <span className="text-base font-bold text-rose-700">{formatCurrency(financials.pending)}</span>
                          </div>
                        </div>

                        {/* Progress report visual details */}
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-gray-700">Progreso total de cobros sobre lo contratado:</span>
                            <span className={`font-bold ${pct === 100 ? 'text-emerald-600' : 'text-[#34877c]'}`}>{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : 'bg-[#34877c]'}`} 
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-gray-500">
                            {pct === 100 
                              ? 'La cuenta del cliente se encuentra 100% saldada.' 
                              : `Se han acreditado parciales por ${formatCurrency(financials.totalPaid)} de un total de ${formatCurrency(financials.totalBudgeted)}.`}
                          </p>
                        </div>

                        {/* Presupuesto-by-presupuesto details (to display partial payments clearly) */}
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Flocado por Presupuesto Comercial</h5>
                          <div className="space-y-1.5">
                            {listApproved.map(b => {
                              const bPaid = b.payments.reduce((sum, p) => sum + p.amount, 0);
                              const bPercent = b.total > 0 ? Math.round((bPaid / b.total) * 100) : 0;
                              return (
                                <div key={b.id} className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded-lg text-xs">
                                  <div>
                                    <span className="font-bold text-gray-800">{b.id}</span>
                                    <span className="text-gray-400 text-[10px] ml-2 font-mono">({b.date})</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-500">{formatCurrency(bPaid)} / {formatCurrency(b.total)}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      bPercent >= 100 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : bPercent > 0 
                                      ? 'bg-amber-100 text-amber-800' 
                                      : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {bPercent >= 100 ? 'PAGADO' : bPercent > 0 ? 'PARTIAL' : 'PENDIENTE'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Payments list history */}
                        {allPayments.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                              <History className="w-3.5 h-3.5 text-gray-400" /> Historial de Transacciones / Ingresos
                            </h5>
                            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                              <table className="w-full text-left text-[11px] text-gray-600">
                                <thead className="bg-[#34877c]/5 text-gray-700 font-semibold border-b border-slate-100">
                                  <tr>
                                    <th className="p-2.5">Fecha</th>
                                    <th className="p-2.5">Presupuesto</th>
                                    <th className="p-2.5">Concepto / Notas</th>
                                    <th className="p-2.5">Método</th>
                                    <th className="p-2.5 text-right">Monto</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                  {allPayments.map(pData => (
                                    <tr key={pData.pay.id} className="hover:bg-slate-50">
                                      <td className="p-2.5">{pData.pay.date}</td>
                                      <td className="p-2.5 font-bold text-[#34877c]">{pData.budId}</td>
                                      <td className="p-2.5 font-sans italic max-w-[200px] truncate">{pData.pay.notes || 'Pago estandar registrado'}</td>
                                      <td className="p-2.5 font-sans">{pData.pay.method}</td>
                                      <td className="p-2.5 text-right font-bold text-emerald-600">{formatCurrency(pData.pay.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-[#34877c]/60">
                <Users className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">No se ha seleccionado ninguna ficha de cliente</h4>
                <p className="text-xs text-gray-400 max-w-sm mt-1">
                  Haz clic en cualquiera de los perfiles del listado lateral para examinar sus datos de contacto, accesos web y balance de facturación detallada.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE CLIENTE */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 text-xs text-gray-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="bg-red-50 p-2 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">¿Eliminar Ficha de Cliente?</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar la ficha de <strong className="text-gray-900">{clientToDelete.name}</strong>? Los presupuestos y carpetas de progreso de trabajo continuarán existiendo intactos en la base de datos de los socios.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClient(clientToDelete.id);
                  if (selectedClient?.id === clientToDelete.id) {
                    setSelectedClient(null);
                  }
                  setClientToDelete(null);
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
