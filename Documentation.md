# MoneyFloat — Complete Project Documentation

> A mobile money reconciliation and balance sheet management app for MoMo vendors/agents in Ghana.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [The Problem Being Solved](#2-the-problem-being-solved)
3. [How the App Works — User Journey](#3-how-the-app-works--user-journey)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Data Layer — Database Design](#6-data-layer--database-design)
7. [Core Business Logic — Reconciliation Engine](#7-core-business-logic--reconciliation-engine)
8. [Commission Calculation Logic](#8-commission-calculation-logic)
9. [Authentication System](#9-authentication-system)
10. [State Management](#10-state-management)
11. [Navigation Architecture](#11-navigation-architecture)
12. [Screen-by-Screen Breakdown](#12-screen-by-screen-breakdown)
13. [Component Library](#13-component-library)
14. [Type System](#14-type-system)
15. [Constants and Utilities](#15-constants-and-utilities)
16. [Data Flow Diagrams](#16-data-flow-diagrams)
17. [Known Limitations and Future Improvements](#17-known-limitations-and-future-improvements)

---

## 1. Project Overview

**MoneyFloat** is an offline-first React Native mobile application built for mobile money (MoMo) agents and vendors operating in Ghana. The app replaces manual paper-based bookkeeping with a digital system that:

- Records every deposit and withdrawal transaction in real time
- Tracks two separate balance types simultaneously: **physical cash** and **e-money float**
- Auto-calculates vendor commission per transaction
- Performs end-of-day reconciliation to detect discrepancies
- Supports multiple agents under a single business (multi-agent architecture)
- Gives admins/business owners a bird's-eye view of all agent activity

**Supported Mobile Money Networks:**
- MTN MoMo (Ghana)
- Telecel Cash (formerly Vodafone Cash)
- AirtelTigo Money

---

## 2. The Problem Being Solved

### How MoMo Vending Works

A mobile money agent is a physical person who acts as a cash-in / cash-out point for people who want to send or receive mobile money. The agent holds two things at all times:

| Asset | Description |
|-------|-------------|
| **Physical Cash** | Real GHS banknotes in their till/drawer |
| **E-Money Float** | Balance in their MoMo account (digital money) |

These two assets are mirror images of each other:

- When a **customer deposits** → customer gives the agent **cash** → agent sends the customer **e-money** → cash goes UP, float goes DOWN
- When a **customer withdraws** → customer sends the agent **e-money** → agent gives the customer **cash** → cash goes DOWN, float goes UP

### The Manual Bookkeeping Problem

Before MoneyFloat, agents tracked this in handwritten notebooks:
- Error-prone additions and subtractions
- No automatic commission calculation
- No detection of discrepancies until noticed manually (sometimes days later)
- No overview for business owners with multiple agents
- No historical reports

MoneyFloat solves all of these.

---

## 3. How the App Works — User Journey

### Admin (Business Owner)

```
Register → Create Business Name → Dashboard
    ├── Add Agents (give them name, phone, PIN, network)
    ├── View all agents' live activity
    ├── View all reconciliation history
    └── View reports
```

### Agent (Vendor)

```
Login with Phone + PIN → Dashboard
    ├── [Start of Day] Open Session → Enter opening float + opening cash
    ├── [During Day] Record Deposit → enter amount, customer phone, network
    ├── [During Day] Record Withdrawal → enter amount, customer phone, network
    ├── [During Day] View all transactions for today
    └── [End of Day] Reconcile
            ├── App shows expected cash and expected float
            ├── Agent physically counts cash and checks MoMo balance
            ├── Agent enters actual cash and actual float
            ├── App calculates variance (difference)
            └── Session closes → result saved
```

---

## 4. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React Native + Expo SDK 54 | Cross-platform (Android + iOS), rapid development |
| Language | TypeScript | Type safety, better developer experience |
| Local Database | expo-sqlite (SQLite) | Offline-first; works without internet |
| Secure Storage | expo-secure-store | Stores user session securely in device keychain |
| Navigation | React Navigation v6 (Native Stack) | Native-feeling screen transitions |
| Icons | @expo/vector-icons (Ionicons) | Comprehensive icon library |
| State Management | React Context API | Lightweight; no need for Redux at this scale |

### Why Offline-First?

Mobile money agents in Ghana often operate in areas with poor or inconsistent mobile data. Using SQLite means:
- All data lives on the device
- The app works 100% without an internet connection
- No server costs at this stage
- Data is private and local

---

## 5. Project Structure

```
MoneyFloat/
├── App.tsx                          # Entry point — wraps providers, inits DB
├── app.json                         # Expo config (app name, icons, permissions)
├── package.json
│
└── src/
    ├── types/
    │   └── index.ts                 # All TypeScript interfaces and types
    │
    ├── constants/
    │   └── index.ts                 # Colors, network commission rates, formatters
    │
    ├── utils/
    │   └── commission.ts            # Commission calc, ID generation, ref generation
    │
    ├── db/
    │   └── database.ts              # All SQLite operations (the entire backend)
    │
    ├── context/
    │   ├── AuthContext.tsx          # User authentication state (global)
    │   └── SessionContext.tsx       # Active daily session state (global)
    │
    ├── navigation/
    │   └── AppNavigator.tsx         # Route definitions, role-based routing
    │
    ├── components/
    │   ├── NetworkBadge.tsx         # Colored network label (MTN/Telecel/AirtelTigo)
    │   ├── StatCard.tsx             # Metric display card with colored border
    │   └── TransactionItem.tsx      # Single transaction row in a list
    │
    └── screens/
        ├── auth/
        │   ├── LoginScreen.tsx      # Phone + PIN login
        │   └── RegisterScreen.tsx   # 2-step registration (personal → business)
        │
        ├── agent/
        │   ├── AgentDashboard.tsx        # Home screen for agents
        │   ├── OpenSessionModal.tsx      # Bottom sheet to start the day
        │   ├── RecordTransactionScreen.tsx  # Record deposit or withdrawal
        │   ├── EndOfDayScreen.tsx        # Reconciliation screen
        │   ├── TransactionsScreen.tsx    # Full list of today's transactions
        │   └── ReportsScreen.tsx         # 7/30-day history
        │
        └── admin/
            ├── AdminDashboard.tsx         # Business overview for admin
            ├── AgentManagementScreen.tsx  # Add/view agents
            └── AllReconciliationsScreen.tsx  # All reconciliation history
```

---

## 6. Data Layer — Database Design

The entire backend is the file [src/db/database.ts](src/db/database.ts). There is no external server. All data is stored in a SQLite file called `moneyfloat.db` on the device.

### Database Initialization

```typescript
// App.tsx calls this once on startup
initDatabase();
```

The init function runs `CREATE TABLE IF NOT EXISTS` for all tables, so it is safe to call every time the app opens. It also sets two important SQLite pragmas:

- `PRAGMA journal_mode = WAL` — Write-Ahead Logging makes concurrent reads faster and more reliable
- `PRAGMA foreign_keys = ON` — Enforces referential integrity between tables

---

### Table: `businesses`

Represents a MoMo business (a shop or network of agents).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique ID generated with `generateId()` |
| name | TEXT | Business name e.g. "Kofi MoMo Shop" |
| adminId | TEXT | ID of the admin user who owns this business |
| createdAt | TEXT | ISO timestamp |

---

### Table: `users`

Both admins and agents are stored here, differentiated by the `role` column.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique ID |
| name | TEXT | Full name |
| phone | TEXT (UNIQUE) | Phone number — used as username for login |
| pin | TEXT | 4–6 digit PIN (stored as plain text — see limitations) |
| role | TEXT | `'admin'` or `'agent'` (CHECK constraint enforced) |
| network | TEXT | `'MTN'`, `'Telecel'`, or `'AirtelTigo'` |
| businessId | TEXT (FK) | Links to `businesses.id` |
| createdAt | TEXT | ISO timestamp |

---

### Table: `daily_sessions`

A session represents one agent's business day. An agent opens a session at the start of the day with their starting balances, and closes it at end of day after reconciliation.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique ID |
| agentId | TEXT (FK) | Which agent this session belongs to |
| businessId | TEXT | Which business (for admin queries) |
| date | TEXT | Date in `YYYY-MM-DD` format (e.g. `2026-04-22`) |
| openingFloat | REAL | E-money balance at start of day |
| openingCash | REAL | Physical cash at start of day |
| closingFloat | REAL | E-money balance at end of day (filled at close) |
| closingCash | REAL | Physical cash at end of day (filled at close) |
| status | TEXT | `'open'` or `'closed'` |
| createdAt | TEXT | ISO timestamp |

**Important rule:** Each agent can only have one `open` session per day. `getTodaySession()` queries by `agentId` AND `date = TODAY()` to enforce this.

---

### Table: `transactions`

Every individual customer interaction recorded during an open session.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique ID |
| agentId | TEXT (FK) | Which agent recorded this |
| sessionId | TEXT (FK) | Which session it belongs to |
| type | TEXT | `'deposit'` or `'withdrawal'` |
| amount | REAL | Transaction amount in GHS |
| customerPhone | TEXT | Customer's phone number |
| network | TEXT | MoMo network used |
| reference | TEXT (UNIQUE) | Auto-generated reference e.g. `MF-LK3F9-AB2C` |
| commission | REAL | Auto-calculated commission earned |
| note | TEXT | Optional agent note |
| createdAt | TEXT | ISO timestamp |

---

### Table: `reconciliations`

A snapshot of the end-of-day audit. Created when the agent closes their session.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique ID |
| sessionId | TEXT (FK, UNIQUE) | One reconciliation per session |
| agentId | TEXT | Who it belongs to |
| date | TEXT | The business day date |
| totalDeposits | REAL | Sum of all deposit amounts |
| totalWithdrawals | REAL | Sum of all withdrawal amounts |
| totalCommission | REAL | Sum of all commissions earned |
| expectedCash | REAL | What cash SHOULD be based on transactions |
| actualCash | REAL | What cash the agent physically counted |
| expectedFloat | REAL | What float SHOULD be based on transactions |
| actualFloat | REAL | What float the agent sees in their MoMo account |
| cashVariance | REAL | `actualCash - expectedCash` (negative = shortage) |
| floatVariance | REAL | `actualFloat - expectedFloat` (negative = shortage) |
| createdAt | TEXT | ISO timestamp |

---

### Entity Relationship Diagram

```
businesses
    │
    └── (1:many) users (via businessId)
                    │
                    └── (1:many) daily_sessions (via agentId)
                                        │
                                        ├── (1:many) transactions (via sessionId)
                                        │
                                        └── (1:1) reconciliations (via sessionId)
```

---

## 7. Core Business Logic — Reconciliation Engine

This is the heart of the app. It lives in `computeDailySummary()` and `saveReconciliation()` in [src/db/database.ts](src/db/database.ts).

### Understanding the Cash/Float Duality

Every transaction simultaneously affects BOTH cash AND float in opposite directions:

```
DEPOSIT (customer gives you money, wants e-money):
  Cash    ↑ (you receive banknotes)
  Float   ↓ (you send e-money to customer)

WITHDRAWAL (customer wants cash, sends you e-money):
  Cash    ↓ (you give banknotes to customer)
  Float   ↑ (you receive e-money from customer)
```

### Expected Balance Formulas

```
expectedCash  = openingCash  + totalDeposits - totalWithdrawals
expectedFloat = openingFloat - totalDeposits + totalWithdrawals
```

**Why these formulas work:**

For cash: You start with some cash. Every deposit adds cash (customer pays you). Every withdrawal removes cash (you pay customer). Simple.

For float: You start with some e-money. Every deposit removes float (you send e-money out). Every withdrawal adds float (you receive e-money). It is the inverse of cash.

**Key insight:** `expectedCash + expectedFloat` should always equal `openingCash + openingFloat`. The total capital never changes — it just moves between cash and float. If this sum changes, something went wrong.

### Variance Detection

```typescript
cashVariance  = actualCash  - expectedCash
floatVariance = actualFloat - expectedFloat
```

| Variance | Meaning |
|----------|---------|
| `0` | Perfectly balanced — books match reality |
| `> 0` | Overage — more money than expected (unusual; could mean unreported transaction or wrong opening balance) |
| `< 0` | Shortage — less money than expected (most common — could mean error, theft, or unreported transaction) |

### Variance Color Coding in the UI

```typescript
if (v === 0)         → green  (balanced)
if (Math.abs(v) < 5) → orange (minor variance — rounding or small error)
if (Math.abs(v) >= 5) → red   (significant variance — investigate)
```

### The Full End-of-Day Flow

```
1. computeDailySummary(sessionId)
   └── Loads session opening balances
   └── Loads all transactions for the session
   └── Calculates totals and expected balances
   └── Returns DailySummary object

2. Agent physically counts cash and checks MoMo app balance

3. saveReconciliation(sessionId, agentId, actualCash, actualFloat)
   └── Calls computeDailySummary() again (live calculation)
   └── Creates Reconciliation record with variances
   └── Calls closeSession() — sets status='closed', saves closing balances
   └── Returns Reconciliation object

4. SessionContext.setActiveSession(null) — clears active session in UI
```

---

## 8. Commission Calculation Logic

Commission is earned by the agent on every transaction. It is calculated automatically when a transaction is recorded.

### Commission Tiers

Defined in [src/constants/index.ts](src/constants/index.ts) as `COMMISSION_RATES`.

**MTN MoMo:**

| Amount Range (GHS) | Rate |
|-------------------|------|
| GHS 1 – 50 | 1.0% |
| GHS 51 – 300 | 0.9% |
| GHS 301 – 1,000 | 0.8% |
| GHS 1,001 – 5,000 | 0.7% |
| GHS 5,001+ | 0.6% |

**Telecel Cash:**

| Amount Range (GHS) | Rate |
|-------------------|------|
| GHS 1 – 50 | 1.0% |
| GHS 51 – 300 | 0.9% |
| GHS 301 – 1,000 | 0.8% |
| GHS 1,001+ | 0.7% |

**AirtelTigo Money:**

| Amount Range (GHS) | Rate |
|-------------------|------|
| GHS 1 – 50 | 1.0% |
| GHS 51 – 300 | 0.9% |
| GHS 301+ | 0.8% |

### Calculation Function

```typescript
// src/utils/commission.ts
export const calculateCommission = (amount: number, network: MomoNetwork): number => {
  const tiers = COMMISSION_RATES[network];
  const tier = tiers.find(t => amount >= t.min && amount <= t.max);
  if (!tier) return 0;
  return parseFloat((amount * tier.rate).toFixed(2));
};
```

**Example:** Agent records a GHS 200 deposit on MTN.
- Tier matched: GHS 51–300 at 0.9%
- Commission: `200 × 0.009 = GHS 1.80`

Commission is stored on the `Transaction` record and summed into `totalCommission` in the reconciliation.

---

## 9. Authentication System

Authentication is handled entirely in [src/context/AuthContext.tsx](src/context/AuthContext.tsx).

### How Login Works

1. User enters phone number + PIN
2. App queries SQLite: `SELECT * FROM users WHERE phone = ?`
3. If user found, PIN is compared directly: `user.pin !== pin`
4. If match, `login(user)` is called:
   - Saves `userId` to device secure storage via `expo-secure-store`
   - Sets user in React Context state
5. `AppNavigator` detects `user !== null` and routes to the appropriate stack

### Session Persistence (Auto-Login)

On app startup, `AuthProvider` runs `restoreSession()`:

```typescript
const userId = await SecureStore.getItemAsync('userId');
if (userId) {
  const storedUser = getUserById(userId);  // reads from SQLite
  if (storedUser) setUser(storedUser);
}
```

This means the user stays logged in even after closing the app. `expo-secure-store` uses the Android Keystore / iOS Keychain — it is encrypted and persists across app restarts.

### How Logout Works

```typescript
await SecureStore.deleteItemAsync('userId');
setUser(null);
```

Removing the `userId` key from secure storage and setting `user` to `null` causes `AppNavigator` to redirect to the auth stack.

### Role-Based Routing

```typescript
// AppNavigator.tsx
{!user ? <AuthStack /> : user.role === 'admin' ? <AdminStack /> : <AgentStack />}
```

A single ternary controls the entire app routing. Admins see `AdminStack`, agents see `AgentStack`, unauthenticated users see `AuthStack`.

---

## 10. State Management

The app uses React Context API with two separate contexts.

### AuthContext

**File:** [src/context/AuthContext.tsx](src/context/AuthContext.tsx)

| Value | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | The currently logged-in user |
| `isLoading` | `boolean` | True while restoring session from secure storage |
| `login(user)` | function | Saves session, sets user |
| `logout()` | function | Clears session, sets user to null |

**Used in:** Every screen that needs to know who is logged in or perform auth operations.

### SessionContext

**File:** [src/context/SessionContext.tsx](src/context/SessionContext.tsx)

| Value | Type | Description |
|-------|------|-------------|
| `activeSession` | `DailySession \| null` | The currently open business day session |
| `setActiveSession` | function | Updates the active session globally |

**Why a separate context?** The active session needs to be shared between the dashboard (which displays it), the record transaction screen (which writes to it), and the end-of-day screen (which closes it). Rather than passing it as props through navigation params, it lives in context so any screen can read or update it.

**Lifecycle:**
- Set to a session when agent opens their day (AgentDashboard)
- Set to `null` when reconciliation is complete (EndOfDayScreen)
- Read by RecordTransactionScreen to know which session to attach new transactions to

---

## 11. Navigation Architecture

**File:** [src/navigation/AppNavigator.tsx](src/navigation/AppNavigator.tsx)

The app uses three separate Navigator stacks:

### AuthStack
Shown when `user === null`.
```
Login ← → Register
```

### AgentStack
Shown when `user.role === 'agent'`.
```
AgentDashboard
    ├── → RecordTransaction (params: { type: 'deposit' | 'withdrawal' })
    ├── → EndOfDay
    ├── → Transactions
    └── → Reports
```

### AdminStack
Shown when `user.role === 'admin'`.
```
AdminDashboard
    ├── → AgentManagement
    ├── → AllReconciliations
    ├── → AdminReports
    ├── → RecordTransaction   (admin can also be an agent)
    ├── → EndOfDay
    └── → Transactions
```

All navigators use `headerShown: false` — custom headers are built into each screen for full design control.

### Navigation Between Screens

Navigation uses the `navigation` prop passed by React Navigation:
```typescript
navigation.navigate('RecordTransaction', { type: 'deposit' })
navigation.goBack()
```

The `route.params` object carries data between screens (e.g., pre-selecting deposit vs withdrawal type).

### Data Refresh on Focus

Several screens use `useFocusEffect` to reload data when navigated back to:
```typescript
useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
```

This ensures the dashboard always shows fresh data after recording a transaction.

---

## 12. Screen-by-Screen Breakdown

### LoginScreen (`src/screens/auth/LoginScreen.tsx`)

**Purpose:** Authenticate existing users.

**Logic:**
1. User enters 10-digit phone number and PIN
2. On submit: `getUserByPhone(phone)` queries SQLite
3. PIN compared: if wrong, show error
4. If correct: `login(user)` from AuthContext → triggers navigation to agent or admin stack

**UI features:** Show/hide PIN toggle, loading state during auth.

---

### RegisterScreen (`src/screens/auth/RegisterScreen.tsx`)

**Purpose:** Create a new account. Two-step process.

**Step 1 — Personal Details:**
- Full name, phone number, PIN, confirm PIN
- Validates PIN length (min 4) and PIN match

**Step 2 — Business Setup:**
- Role selection: Admin (business owner) or Agent
- Network selection: MTN / Telecel / AirtelTigo
- If Admin: enter business name → `createBusiness()` + `createUser()` called
- If Agent: requires business code (not yet implemented — admin must add agents from AgentManagement screen)

---

### AgentDashboard (`src/screens/agent/AgentDashboard.tsx`)

**Purpose:** The main home screen for agents. Shows live day stats.

**On load (`useFocusEffect`):**
1. Calls `getTodaySession(user.id)` — checks if an open session exists for today
2. If session found: calls `computeDailySummary(session.id)` → renders live stats
3. If no session: shows "Open Today's Session" prompt

**States:**
- **No session:** CTA button to open session
- **Active session:** Shows cash balance, float balance, deposit/withdrawal totals, commission, recent transactions, and action buttons

**Key stat displayed — Cash on Hand:**
This is `expectedCash` from `computeDailySummary()`. It tells the agent how much physical cash they should have at any point during the day without them needing to count it.

---

### OpenSessionModal (`src/screens/agent/OpenSessionModal.tsx`)

**Purpose:** Bottom sheet modal for starting the business day.

**Input:**
- Opening Float (e-money balance in MoMo account right now)
- Opening Cash (physical cash in till right now)

**On submit:** Calls `openDailySession(agentId, businessId, openingFloat, openingCash)` → creates a new session record in SQLite → `SessionContext.setActiveSession()` called.

The opening balances are critical — all subsequent calculations are relative to these starting values.

---

### RecordTransactionScreen (`src/screens/agent/RecordTransactionScreen.tsx`)

**Purpose:** Record a single deposit or withdrawal.

**Fields:**
- Type toggle (Deposit / Withdrawal)
- Network selector (MTN / Telecel / AirtelTigo)
- Amount (large numeric input)
- Customer phone number
- Optional note

**Live commission preview:** As the agent types the amount, `calculateCommission(amount, network)` runs live and shows the estimated commission.

**On submit:**
1. Validates that an active session exists
2. Validates amount > 0 and phone length ≥ 10
3. Shows confirmation alert with full transaction summary
4. On confirm: calls `recordTransaction()` → inserts into `transactions` table
5. Shows success alert with reference number and commission earned
6. Clears form for next transaction

---

### EndOfDayScreen (`src/screens/agent/EndOfDayScreen.tsx`)

**Purpose:** The reconciliation screen. Used at the end of every business day.

**Phase 1 — Review:**
- Shows the day summary (deposits, withdrawals, commission)
- Shows computed `expectedCash` and `expectedFloat`
- Agent physically counts their cash drawer and checks their MoMo app balance
- Agent enters `actualCash` and `actualFloat`
- Live variance feedback shown as they type (green/orange/red)

**Phase 2 — Confirmation:**
- Alert shows the variance summary
- If variance > GHS 50, the "Close Session" button becomes destructive (red) as a warning
- Agent confirms → `saveReconciliation()` called

**Phase 3 — Result Screen:**
- Full reconciliation report displayed in-screen
- Shows: opening balances, transaction totals, expected vs actual, variance, net position
- "Done" button navigates back to dashboard

---

### TransactionsScreen (`src/screens/agent/TransactionsScreen.tsx`)

**Purpose:** Full scrollable list of today's transactions.

**Features:**
- Search by customer phone number or reference code
- Filter by All / Deposit / Withdrawal
- Each row shows type, network badge, customer phone, reference, amount, commission, timestamp

---

### ReportsScreen (`src/screens/agent/ReportsScreen.tsx`)

**Purpose:** Historical performance for an agent.

**Features:**
- Toggle between last 7 days and last 30 days
- Summary cards: total deposits, total withdrawals, total commission, days worked
- Accuracy insight: shows how many sessions were perfectly balanced
- Daily history list: each closed session's date, balance result, and transaction totals

---

### AdminDashboard (`src/screens/admin/AdminDashboard.tsx`)

**Purpose:** Business-wide overview for the admin/owner.

**On load:**
1. Loads business details from `getBusinessById()`
2. Loads all agents via `getAgentsByBusiness(businessId)`
3. For each agent: calls `getTodaySession()` and `computeDailySummary()` to get live stats

**Displays:**
- Active agents count (agents with an open session today)
- Business-wide totals: deposits, withdrawals, commission for today
- Quick action buttons: Agents, Reports, Reconciliations
- Per-agent card showing their name, network, and live stats (or "No active session")

---

### AgentManagementScreen (`src/screens/admin/AgentManagementScreen.tsx`)

**Purpose:** Admin creates and views agents for their business.

**Add Agent flow:**
1. Admin taps the person-add icon (top right)
2. Bottom sheet modal opens
3. Admin enters: name, phone, initial PIN, network
4. Calls `createUser()` → inserts agent into `users` table with `businessId` of the admin's business
5. Agent can now log in with the phone number and PIN the admin set

**Note:** The agent registration flow currently requires the admin to add agents. The self-registration "business code" path is stubbed with an error message guiding agents to their admin.

---

### AllReconciliationsScreen (`src/screens/admin/AllReconciliationsScreen.tsx`)

**Purpose:** Admin view of every reconciliation across all agents.

**Query used:**
```sql
SELECT r.* FROM reconciliations r
JOIN daily_sessions s ON r.sessionId = s.id
WHERE s.businessId = ?
ORDER BY r.date DESC LIMIT 30
```

**Displays per reconciliation:**
- Date, agent name
- Balanced / Variance badge
- Deposit, withdrawal, commission totals
- Variance amounts if not balanced

---

## 13. Component Library

### NetworkBadge (`src/components/NetworkBadge.tsx`)

A colored pill/badge showing the network name. Color is pulled from `NETWORK_COLORS` constant.

```typescript
<NetworkBadge network="MTN" size="sm" />
<NetworkBadge network="Telecel" size="md" />
```

Colors: MTN = Gold, Telecel = Red, AirtelTigo = Orange.

---

### StatCard (`src/components/StatCard.tsx`)

A card with a colored left border showing a metric label, value, and optional sub-text.

```typescript
<StatCard
  label="Cash on Hand"
  value="GHS 450.00"
  color={COLORS.success}
  sub="3 deposits"
/>
```

Used on dashboards in pairs (two per row).

---

### TransactionItem (`src/components/TransactionItem.tsx`)

A single transaction row rendered in lists. Shows:
- Colored circular icon (green down arrow for deposit, red up arrow for withdrawal)
- Transaction type, network badge
- Customer phone, reference
- Amount (colored green/red), commission, timestamp

---

## 14. Type System

All TypeScript types are defined in [src/types/index.ts](src/types/index.ts).

### Primitive Types

```typescript
type UserRole = 'admin' | 'agent'
type MomoNetwork = 'MTN' | 'Telecel' | 'AirtelTigo'
type TransactionType = 'deposit' | 'withdrawal'
type SessionStatus = 'open' | 'closed'
```

### Core Interfaces

**User** — represents both admins and agents  
**Business** — the umbrella entity that groups agents  
**Transaction** — a single customer deposit or withdrawal  
**DailySession** — one agent's business day (open → closed)  
**Reconciliation** — the permanent end-of-day audit record  
**DailySummary** — a computed, in-memory object (not stored in DB) used for live dashboard display and pre-reconciliation review

`DailySummary` is the only interface that is not directly stored in the database — it is computed on-the-fly by `computeDailySummary()` and used by the dashboard and end-of-day screen.

---

## 15. Constants and Utilities

### Colors (`src/constants/index.ts`)

The design system uses two primary colors inspired by Ghana MoMo branding:
- **Primary: `#FFD700`** (Gold) — MTN MoMo yellow, used for highlights, buttons, commission
- **Secondary: `#1A1A2E`** (Dark Navy) — used for headers and backgrounds

All colors are referenced via the `COLORS` object, never hardcoded in screens.

### Formatting Utilities

```typescript
formatCurrency(1200.50)     // → "GHS 1200.50"
formatDate("2026-04-22")    // → "22 Apr 2026"
formatTime("2026-04-22T14:30:00.000Z")  // → "2:30 PM"
TODAY()                      // → "2026-04-22"
```

### ID and Reference Generation (`src/utils/commission.ts`)

```typescript
generateId()
// → "lk3f9gz2abc4d"  (base-36 timestamp + random)

generateReference()
// → "MF-LK3F9-AB2C"  (human-readable, prefixed with MF-)
```

References are unique per transaction and shown to customers as proof of transaction.

---

## 16. Data Flow Diagrams

### Recording a Deposit

```
Agent taps "Deposit"
    └── RecordTransactionScreen renders with type='deposit'
    └── Agent fills: amount=200, phone=0244123456, network=MTN
    └── calculateCommission(200, 'MTN') → GHS 1.80
    └── Agent confirms
    └── recordTransaction(agentId, sessionId, 'deposit', 200, ...)
            └── Inserts into transactions table
    └── Dashboard reloads on next focus
            └── computeDailySummary(sessionId)
                    └── expectedCash += 200  ↑
                    └── expectedFloat -= 200 ↓
```

### End of Day Reconciliation

```
Agent taps "Reconcile"
    └── EndOfDayScreen loads computeDailySummary()
    └── expectedCash = openingCash + deposits - withdrawals
    └── expectedFloat = openingFloat - deposits + withdrawals
    └── Agent counts: actualCash=850, actualFloat=1200
    └── cashVariance  = 850 - 860  = -10  (GHS 10 short)
    └── floatVariance = 1200 - 1190 = +10  (GHS 10 over)
    └── saveReconciliation() called
            └── Inserts reconciliation record
            └── closeSession() → session status = 'closed'
    └── SessionContext.setActiveSession(null)
    └── Result screen shows full audit
```

---

## 17. Known Limitations and Future Improvements

### Current Limitations

| Issue | Detail |
|-------|--------|
| PIN not hashed | PINs are stored as plain text in SQLite. For production, use bcrypt or similar hashing |
| No data backup | All data is local to the device. If device is lost, data is gone |
| Agent self-registration incomplete | Agents cannot join a business by code yet — admin must add them manually |
| No cloud sync | Multi-agent data only syncs if admin physically uses the same device or if a backend is added |
| Commission rates are approximate | Actual MoMo vendor commission rates change periodically and vary by region |
| No PIN change feature | Agents cannot change their PIN after initial setup |
| No transaction editing | Recorded transactions cannot be edited or deleted |

### Planned Future Features

1. **Cloud Backend (Supabase)** — Sync all data to a cloud database so admin can see agent data in real time on any device
2. **MoMo API Integration** — Auto-import transactions from MTN MoMo API and Telecel API to reduce manual entry
3. **PIN Hashing** — Hash PINs with bcrypt before storage
4. **Push Notifications** — Alert admin when an agent closes their session or has a large variance
5. **Export to PDF/CSV** — Print daily reconciliation reports
6. **Multi-network per agent** — Allow agents to handle multiple networks in a single session
7. **Business code agent join flow** — Generate a joinable business code so agents can self-register
8. **Expense tracking** — Track overhead costs (airtime, transport) that eat into commission
9. **Float top-up reminders** — Alert agent when float is running low
10. **Offline sync queue** — Queue changes locally when offline and sync when connected

---

*Documentation written for MoneyFloat v1.0.0 — April 2026*
