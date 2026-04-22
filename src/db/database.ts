import * as SQLite from 'expo-sqlite';
import {
  User, Business, Transaction, DailySession, Reconciliation, DailySummary
} from '../types';
import { generateId, generateReference, calculateCommission } from '../utils/commission';
import { TODAY } from '../constants';

let db: SQLite.SQLiteDatabase;

export const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync('moneyfloat.db');
  }
  return db;
};

export const initDatabase = async (): Promise<void> => {
  const database = getDb();

  database.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      adminId TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','agent')),
      network TEXT NOT NULL CHECK(network IN ('MTN','Telecel','AirtelTigo')),
      businessId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS daily_sessions (
      id TEXT PRIMARY KEY,
      agentId TEXT NOT NULL,
      businessId TEXT NOT NULL,
      date TEXT NOT NULL,
      openingFloat REAL NOT NULL DEFAULT 0,
      openingCash REAL NOT NULL DEFAULT 0,
      closingFloat REAL,
      closingCash REAL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      createdAt TEXT NOT NULL,
      FOREIGN KEY (agentId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      agentId TEXT NOT NULL,
      sessionId TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deposit','withdrawal')),
      amount REAL NOT NULL,
      customerPhone TEXT NOT NULL,
      network TEXT NOT NULL,
      reference TEXT NOT NULL UNIQUE,
      commission REAL NOT NULL DEFAULT 0,
      note TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (agentId) REFERENCES users(id),
      FOREIGN KEY (sessionId) REFERENCES daily_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS reconciliations (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL UNIQUE,
      agentId TEXT NOT NULL,
      date TEXT NOT NULL,
      totalDeposits REAL NOT NULL DEFAULT 0,
      totalWithdrawals REAL NOT NULL DEFAULT 0,
      totalCommission REAL NOT NULL DEFAULT 0,
      expectedCash REAL NOT NULL DEFAULT 0,
      actualCash REAL NOT NULL DEFAULT 0,
      expectedFloat REAL NOT NULL DEFAULT 0,
      actualFloat REAL NOT NULL DEFAULT 0,
      cashVariance REAL NOT NULL DEFAULT 0,
      floatVariance REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (sessionId) REFERENCES daily_sessions(id)
    );
  `);
};

// ─── Business ───────────────────────────────────────────────────────────────

export const createBusiness = (name: string, adminId: string): Business => {
  const database = getDb();
  const business: Business = {
    id: generateId(),
    name,
    adminId,
    createdAt: new Date().toISOString(),
  };
  database.runSync(
    'INSERT INTO businesses (id, name, adminId, createdAt) VALUES (?, ?, ?, ?)',
    [business.id, business.name, business.adminId, business.createdAt]
  );
  return business;
};

export const getBusinessById = (id: string): Business | null => {
  const database = getDb();
  return database.getFirstSync<Business>('SELECT * FROM businesses WHERE id = ?', [id]);
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const createUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const database = getDb();
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  database.runSync(
    'INSERT INTO users (id, name, phone, pin, role, network, businessId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [newUser.id, newUser.name, newUser.phone, newUser.pin, newUser.role, newUser.network, newUser.businessId, newUser.createdAt]
  );
  return newUser;
};

export const getUserByPhone = (phone: string): User | null => {
  const database = getDb();
  return database.getFirstSync<User>('SELECT * FROM users WHERE phone = ?', [phone]);
};

export const getUserById = (id: string): User | null => {
  const database = getDb();
  return database.getFirstSync<User>('SELECT * FROM users WHERE id = ?', [id]);
};

export const getAgentsByBusiness = (businessId: string): User[] => {
  const database = getDb();
  return database.getAllSync<User>(
    "SELECT * FROM users WHERE businessId = ? AND role = 'agent' ORDER BY name ASC",
    [businessId]
  );
};

// ─── Sessions ────────────────────────────────────────────────────────────────

export const openDailySession = (
  agentId: string,
  businessId: string,
  openingFloat: number,
  openingCash: number
): DailySession => {
  const database = getDb();
  const session: DailySession = {
    id: generateId(),
    agentId,
    businessId,
    date: TODAY(),
    openingFloat,
    openingCash,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  database.runSync(
    'INSERT INTO daily_sessions (id, agentId, businessId, date, openingFloat, openingCash, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [session.id, session.agentId, session.businessId, session.date, session.openingFloat, session.openingCash, session.status, session.createdAt]
  );
  return session;
};

export const getTodaySession = (agentId: string): DailySession | null => {
  const database = getDb();
  return database.getFirstSync<DailySession>(
    "SELECT * FROM daily_sessions WHERE agentId = ? AND date = ? ORDER BY createdAt DESC LIMIT 1",
    [agentId, TODAY()]
  );
};

export const getSessionById = (id: string): DailySession | null => {
  const database = getDb();
  return database.getFirstSync<DailySession>('SELECT * FROM daily_sessions WHERE id = ?', [id]);
};

export const closeSession = (sessionId: string, closingFloat: number, closingCash: number): void => {
  const database = getDb();
  database.runSync(
    "UPDATE daily_sessions SET status = 'closed', closingFloat = ?, closingCash = ? WHERE id = ?",
    [closingFloat, closingCash, sessionId]
  );
};

export const getAllSessionsByBusiness = (businessId: string, limit = 30): DailySession[] => {
  const database = getDb();
  return database.getAllSync<DailySession>(
    'SELECT * FROM daily_sessions WHERE businessId = ? ORDER BY date DESC LIMIT ?',
    [businessId, limit]
  );
};

export const getSessionsByAgent = (agentId: string, limit = 30): DailySession[] => {
  const database = getDb();
  return database.getAllSync<DailySession>(
    'SELECT * FROM daily_sessions WHERE agentId = ? ORDER BY date DESC LIMIT ?',
    [agentId, limit]
  );
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const recordTransaction = (
  agentId: string,
  sessionId: string,
  type: 'deposit' | 'withdrawal',
  amount: number,
  customerPhone: string,
  network: 'MTN' | 'Telecel' | 'AirtelTigo',
  note?: string
): Transaction => {
  const database = getDb();
  const commission = calculateCommission(amount, network);
  const tx: Transaction = {
    id: generateId(),
    agentId,
    sessionId,
    type,
    amount,
    customerPhone,
    network,
    reference: generateReference(),
    commission,
    note,
    createdAt: new Date().toISOString(),
  };
  database.runSync(
    'INSERT INTO transactions (id, agentId, sessionId, type, amount, customerPhone, network, reference, commission, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [tx.id, tx.agentId, tx.sessionId, tx.type, tx.amount, tx.customerPhone, tx.network, tx.reference, tx.commission, tx.note ?? null, tx.createdAt]
  );
  return tx;
};

export const getTransactionsBySession = (sessionId: string): Transaction[] => {
  const database = getDb();
  return database.getAllSync<Transaction>(
    'SELECT * FROM transactions WHERE sessionId = ? ORDER BY createdAt DESC',
    [sessionId]
  );
};

export const getTransactionsByAgent = (agentId: string, limit = 50): Transaction[] => {
  const database = getDb();
  return database.getAllSync<Transaction>(
    'SELECT * FROM transactions WHERE agentId = ? ORDER BY createdAt DESC LIMIT ?',
    [agentId, limit]
  );
};

// ─── Reconciliation ───────────────────────────────────────────────────────────

export const computeDailySummary = (sessionId: string): DailySummary => {
  const database = getDb();
  const session = getSessionById(sessionId)!;
  const txns = getTransactionsBySession(sessionId);

  const deposits = txns.filter(t => t.type === 'deposit');
  const withdrawals = txns.filter(t => t.type === 'withdrawal');

  const totalDeposits = deposits.reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = withdrawals.reduce((s, t) => s + t.amount, 0);
  const totalCommission = txns.reduce((s, t) => s + t.commission, 0);

  // Cash: starts at openingCash, increases with deposits (customer pays cash), decreases with withdrawals (agent pays cash out)
  const expectedCash = session.openingCash + totalDeposits - totalWithdrawals;
  // Float (e-money): starts at openingFloat, decreases with deposits (agent sends e-money), increases with withdrawals (agent receives e-money)
  const expectedFloat = session.openingFloat - totalDeposits + totalWithdrawals;

  return {
    session,
    totalDeposits,
    totalWithdrawals,
    depositCount: deposits.length,
    withdrawalCount: withdrawals.length,
    totalCommission,
    expectedCash,
    expectedFloat,
  };
};

export const saveReconciliation = (
  sessionId: string,
  agentId: string,
  actualCash: number,
  actualFloat: number
): Reconciliation => {
  const database = getDb();
  const summary = computeDailySummary(sessionId);

  const recon: Reconciliation = {
    id: generateId(),
    sessionId,
    agentId,
    date: summary.session.date,
    totalDeposits: summary.totalDeposits,
    totalWithdrawals: summary.totalWithdrawals,
    totalCommission: summary.totalCommission,
    expectedCash: summary.expectedCash,
    actualCash,
    expectedFloat: summary.expectedFloat,
    actualFloat,
    cashVariance: actualCash - summary.expectedCash,
    floatVariance: actualFloat - summary.expectedFloat,
    createdAt: new Date().toISOString(),
  };

  database.runSync(
    `INSERT INTO reconciliations
      (id, sessionId, agentId, date, totalDeposits, totalWithdrawals, totalCommission,
       expectedCash, actualCash, expectedFloat, actualFloat, cashVariance, floatVariance, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [recon.id, recon.sessionId, recon.agentId, recon.date, recon.totalDeposits, recon.totalWithdrawals,
     recon.totalCommission, recon.expectedCash, recon.actualCash, recon.expectedFloat, recon.actualFloat,
     recon.cashVariance, recon.floatVariance, recon.createdAt]
  );

  closeSession(sessionId, actualFloat, actualCash);

  return recon;
};

export const getReconciliationBySession = (sessionId: string): Reconciliation | null => {
  const database = getDb();
  return database.getFirstSync<Reconciliation>(
    'SELECT * FROM reconciliations WHERE sessionId = ?',
    [sessionId]
  );
};

export const getReconciliationsByBusiness = (businessId: string, limit = 30): Reconciliation[] => {
  const database = getDb();
  return database.getAllSync<Reconciliation>(
    `SELECT r.* FROM reconciliations r
     JOIN daily_sessions s ON r.sessionId = s.id
     WHERE s.businessId = ?
     ORDER BY r.date DESC LIMIT ?`,
    [businessId, limit]
  );
};

export const getReconciliationsByAgent = (agentId: string, limit = 30): Reconciliation[] => {
  const database = getDb();
  return database.getAllSync<Reconciliation>(
    'SELECT * FROM reconciliations WHERE agentId = ? ORDER BY date DESC LIMIT ?',
    [agentId, limit]
  );
};
