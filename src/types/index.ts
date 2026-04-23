export type UserRole = 'admin' | 'agent';

export type MomoNetwork = 'MTN' | 'Telecel' | 'AirtelTigo';

export type TransactionType = 'deposit' | 'withdrawal';

export type ReplenishmentType = 'cash' | 'float';

export interface Replenishment {
  id: string;
  agentId: string;
  sessionId: string;
  type: ReplenishmentType;
  amount: number;
  note?: string;
  createdAt: string;
}

export type SessionStatus = 'open' | 'closed';

export interface User {
  id: string;
  name: string;
  phone: string;
  pin: string;
  role: UserRole;
  network: MomoNetwork;
  businessId: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  adminId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  agentId: string;
  sessionId: string;
  type: TransactionType;
  amount: number;
  customerPhone: string;
  network: MomoNetwork;
  reference: string;
  commission: number;
  note?: string;
  createdAt: string;
}

export interface DailySession {
  id: string;
  agentId: string;
  businessId: string;
  date: string;
  openingFloat: number;
  openingCash: number;
  closingFloat?: number;
  closingCash?: number;
  status: SessionStatus;
  createdAt: string;
}

export interface Reconciliation {
  id: string;
  sessionId: string;
  agentId: string;
  date: string;
  totalDeposits: number;
  totalWithdrawals: number;
  totalCommission: number;
  totalCashReplenishments: number;
  totalFloatReplenishments: number;
  expectedCash: number;
  actualCash: number;
  expectedFloat: number;
  actualFloat: number;
  cashVariance: number;
  floatVariance: number;
  createdAt: string;
}

export interface DailySummary {
  session: DailySession;
  totalDeposits: number;
  totalWithdrawals: number;
  depositCount: number;
  withdrawalCount: number;
  totalCommission: number;
  totalCashReplenishments: number;
  totalFloatReplenishments: number;
  expectedCash: number;
  expectedFloat: number;
}
