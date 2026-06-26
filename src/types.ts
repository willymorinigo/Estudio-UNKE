/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WebData {
  url?: string;
  username?: string;
  password?: string;
  hostingInfo?: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  category?: 'A' | 'B' | 'C';
  company: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  hasWebServices: boolean;
  webData?: WebData;
  createdAt: string;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface DesignPiece {
  id: string;
  name: string;
  category: string;
  price: number; // Preset value in Argentine Pesos ($)
  description?: string;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface PreloadedTask {
  id: string;
  name: string;
  category: string;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  completed?: boolean;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string; // Transferencia, Efectivo, Mercado Pago, etc.
  notes?: string;
}

export type BudgetStatus = 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado';

export interface Budget {
  id: string; // e.g., PP-2026-001
  clientId: string;
  clientName: string;
  date: string;
  items: BudgetItem[];
  total: number;
  notes?: string;
  status: BudgetStatus;
  paymentStatus: 'Pendiente' | 'Parcial' | 'Completo';
  payments: Payment[];
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
  estimatedDeliveryDate?: string;
  isMonthly?: boolean;
  monthlyBillingDay?: number;
}

export type ProjectStatus = 'Planificado' | 'En Progreso' | 'En Revision' | 'Completado' | 'Pausado';

export interface ProjectTask {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string;
  isMaintenance?: boolean;
  monthlyBillingDay?: number;
  monthlyBillingAmount?: number;
}

export interface MaintenancePayment {
  id: string;
  date: string;         // YYYY-MM-DD
  amount: number;       // Amount paid
  period: string;       // e.g. "Junio 2026"
  method: string;       // e.g. "Transferencia", "Mercado Pago", "Efectivo"
  notes?: string;
  registeredBy?: string;
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description?: string;
  budgetId?: string; // Linked budget if any
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  tasks: ProjectTask[];
  pieces: BudgetItem[];
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
  estimatedDeliveryDate?: string;
  
  // Monthly maintenance options
  isMonthlyMaintenance?: boolean;
  monthlyAmount?: number;
  nextDueDate?: string; // YYYY-MM-DD
  maintenancePayments?: MaintenancePayment[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string; // ISO string
}

