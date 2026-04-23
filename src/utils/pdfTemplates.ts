import { Reconciliation, User, Business } from '../types';
import { formatDate } from '../constants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NAVY   = '#1A1A2E';
const GOLD   = '#B8960C';   // darker gold — legible on white
const GREEN  = '#1E8449';
const RED    = '#C0392B';
const BLUE   = '#1A5276';
const ORANGE = '#D35400';
const LIGHT  = '#F4F6F9';
const BORDER = '#D5D8DC';
const TEXT   = '#1C2833';
const MUTED  = '#566573';

const fmt = (n: number): string =>
  '₵' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const vLabel = (v: number): string => {
  if (Math.abs(v) < 0.01) return 'Balanced';
  return v > 0 ? `+${fmt(v)} Overage` : `${fmt(v)} Shortage`;
};

const vColor = (v: number): string => {
  if (Math.abs(v) < 0.01) return GREEN;
  if (Math.abs(v) < 5)    return ORANGE;
  return RED;
};

const now = (): string =>
  new Date().toLocaleString('en-GH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ─── Shared CSS ──────────────────────────────────────────────────────────────

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 12px;
    color: ${TEXT};
    background: #ffffff;
    line-height: 1.5;
  }
  .page { max-width: 680px; margin: 0 auto; padding: 28px 24px 40px; }

  /* ── Header ── */
  .header {
    background: ${NAVY};
    border-radius: 10px;
    padding: 22px 24px 18px;
    margin-bottom: 22px;
  }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand-name { font-size: 24px; font-weight: 900; color: ${GOLD}; letter-spacing: 0.5px; }
  .brand-sub  { font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 2px; }
  .doc-info   { text-align: right; }
  .doc-title  { font-size: 13px; font-weight: 700; color: #ffffff; }
  .doc-gen    { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px; }
  .header-meta {
    display: flex; flex-wrap: wrap; gap: 0;
    margin-top: 16px; padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.15);
  }
  .meta-item { flex: 1; min-width: 100px; padding-right: 12px; margin-bottom: 4px; }
  .meta-label { font-size: 9px; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.6px; }
  .meta-value { font-size: 12px; font-weight: 600; color: #ffffff; margin-top: 2px; word-break: break-word; }

  /* ── Section ── */
  .section { margin-bottom: 18px; }
  .section-title {
    font-size: 10px; font-weight: 700; color: ${MUTED};
    text-transform: uppercase; letter-spacing: 0.8px;
    padding-bottom: 6px; margin-bottom: 10px;
    border-bottom: 2px solid ${NAVY};
  }

  /* ── Stat grid ── */
  .stat-row { display: flex; gap: 10px; margin-bottom: 10px; }
  .stat-box {
    flex: 1; background: ${LIGHT}; border-radius: 8px; padding: 12px 14px;
    border-left: 4px solid ${BORDER};
    min-width: 0;
  }
  .stat-box.g  { border-left-color: ${GREEN}; }
  .stat-box.r  { border-left-color: ${RED}; }
  .stat-box.b  { border-left-color: ${BLUE}; }
  .stat-box.o  { border-left-color: ${ORANGE}; }
  .stat-box.n  { border-left-color: ${NAVY}; }
  .stat-label  { font-size: 9px; font-weight: 700; color: ${MUTED}; text-transform: uppercase; letter-spacing: 0.4px; }
  .stat-value  { font-size: 17px; font-weight: 800; color: ${TEXT}; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .stat-value.g { color: ${GREEN}; }
  .stat-value.r { color: ${RED}; }
  .stat-value.b { color: ${BLUE}; }
  .stat-value.o { color: ${ORANGE}; }
  .stat-sub    { font-size: 10px; color: ${MUTED}; margin-top: 2px; }

  /* ── Detail card ── */
  .detail-card {
    background: ${LIGHT}; border-radius: 8px; overflow: hidden;
    margin-bottom: 10px; border: 1px solid ${BORDER};
  }
  .detail-card-title {
    background: ${NAVY}; color: #fff;
    font-size: 11px; font-weight: 700;
    padding: 8px 14px; letter-spacing: 0.3px;
  }
  .detail-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 14px; border-bottom: 1px solid ${BORDER};
    gap: 12px;
  }
  .detail-row:last-child { border-bottom: none; }
  .detail-row.total {
    background: #ffffff; font-weight: 700;
    border-top: 2px solid ${NAVY};
  }
  .detail-row.result {
    background: #ffffff; font-weight: 700; font-size: 13px;
  }
  .detail-label { color: ${MUTED}; flex: 1; font-size: 11px; white-space: nowrap; }
  .detail-value { font-size: 11px; font-weight: 600; color: ${TEXT}; text-align: right; white-space: nowrap; }
  .detail-value.g { color: ${GREEN}; }
  .detail-value.r { color: ${RED}; }
  .detail-value.b { color: ${BLUE}; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
  colgroup col { overflow: hidden; }
  thead tr { background: ${NAVY}; }
  thead th {
    color: #ffffff; padding: 9px 10px;
    font-size: 10px; font-weight: 700;
    text-align: left; letter-spacing: 0.3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  tbody tr:nth-child(even) { background: ${LIGHT}; }
  tbody tr:nth-child(odd)  { background: #ffffff; }
  tbody td {
    padding: 8px 10px; vertical-align: middle;
    border-bottom: 1px solid ${BORDER};
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  tfoot tr { background: ${NAVY}; }
  tfoot td {
    color: #ffffff; font-weight: 700; font-size: 11px;
    padding: 9px 10px; white-space: nowrap;
  }

  /* ── Badges ── */
  .badge {
    display: inline-block; padding: 3px 9px; border-radius: 10px;
    font-size: 10px; font-weight: 700; white-space: nowrap;
  }
  .badge-ok  { background: #D5F5E3; color: ${GREEN}; }
  .badge-var { background: #FDEBD0; color: ${ORANGE}; }

  /* ── Result banner ── */
  .result-banner {
    text-align: center; padding: 12px;
    border-radius: 8px; margin-top: 8px; margin-bottom: 18px;
    font-size: 13px; font-weight: 800; letter-spacing: 0.3px;
  }
  .result-ok  { background: #D5F5E3; color: ${GREEN}; border: 1px solid ${GREEN}; }
  .result-var { background: #FDEBD0; color: ${ORANGE}; border: 1px solid ${ORANGE}; }
  .result-bad { background: #FADBD8; color: ${RED};    border: 1px solid ${RED}; }

  /* ── Footer ── */
  .footer { margin-top: 28px; padding-top: 16px; border-top: 2px solid ${NAVY}; }
  .sig-row { display: flex; gap: 20px; margin-top: 28px; }
  .sig-box { flex: 1; }
  .sig-line { border-top: 1px solid ${TEXT}; padding-top: 5px; font-size: 10px; color: ${MUTED}; margin-top: 28px; }
  .footer-note { font-size: 9px; color: ${MUTED}; text-align: center; margin-top: 14px; }

  .text-g { color: ${GREEN}; }
  .text-r { color: ${RED}; }
  .text-b { color: ${BLUE}; }
  .text-o { color: ${ORANGE}; }
  .bold   { font-weight: 700; }
`;

// ─── Daily Reconciliation Report ─────────────────────────────────────────────

export const generateDailyReconciliationHTML = (
  recon: Reconciliation,
  agent: User,
  business: Business,
  session: { openingFloat: number; openingCash: number }
): string => {
  const balanced = Math.abs(recon.cashVariance) + Math.abs(recon.floatVariance) < 0.01;
  const majorVariance = Math.abs(recon.cashVariance) + Math.abs(recon.floatVariance) >= 5;
  const resultClass = balanced ? 'result-ok' : majorVariance ? 'result-bad' : 'result-var';
  const resultText = balanced
    ? '✓  Books are perfectly balanced'
    : `⚠  Variance detected — Cash: ${vLabel(recon.cashVariance)}  |  Float: ${vLabel(recon.floatVariance)}`;

  const hasCashTopUp  = recon.totalCashReplenishments  > 0;
  const hasFloatTopUp = recon.totalFloatReplenishments > 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>MoneyFloat Daily Reconciliation — ${formatDate(recon.date)}</title>
  <style>${CSS}</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="brand-name">MoneyFloat</div>
        <div class="brand-sub">Mobile Money Reconciliation System · Ghana</div>
      </div>
      <div class="doc-info">
        <div class="doc-title">Daily Reconciliation Report</div>
        <div class="doc-gen">Generated: ${now()}</div>
      </div>
    </div>
    <div class="header-meta">
      <div class="meta-item"><div class="meta-label">Business</div><div class="meta-value">${business.name}</div></div>
      <div class="meta-item"><div class="meta-label">Agent</div><div class="meta-value">${agent.name}</div></div>
      <div class="meta-item"><div class="meta-label">Phone</div><div class="meta-value">${agent.phone}</div></div>
      <div class="meta-item"><div class="meta-label">Network</div><div class="meta-value">${agent.network}</div></div>
      <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${formatDate(recon.date)}</div></div>
    </div>
  </div>

  <!-- OPENING BALANCES -->
  <div class="section">
    <div class="section-title">Opening Balances</div>
    <div class="stat-row">
      <div class="stat-box b">
        <div class="stat-label">Opening Float (E-Money)</div>
        <div class="stat-value b">${fmt(session.openingFloat)}</div>
        <div class="stat-sub">E-money at start of day</div>
      </div>
      <div class="stat-box n">
        <div class="stat-label">Opening Cash</div>
        <div class="stat-value">${fmt(session.openingCash)}</div>
        <div class="stat-sub">Physical cash at start of day</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Total Opening Capital</div>
        <div class="stat-value">${fmt(session.openingFloat + session.openingCash)}</div>
        <div class="stat-sub">Float + Cash</div>
      </div>
    </div>
  </div>

  <!-- TRANSACTION SUMMARY -->
  <div class="section">
    <div class="section-title">Transaction Summary</div>
    <div class="stat-row">
      <div class="stat-box g">
        <div class="stat-label">Total Deposits</div>
        <div class="stat-value g">${fmt(recon.totalDeposits)}</div>
        <div class="stat-sub">Cash received from customers</div>
      </div>
      <div class="stat-box r">
        <div class="stat-label">Total Withdrawals</div>
        <div class="stat-value r">${fmt(recon.totalWithdrawals)}</div>
        <div class="stat-sub">Cash paid out to customers</div>
      </div>
      <div class="stat-box o">
        <div class="stat-label">Commission Earned</div>
        <div class="stat-value o">${fmt(recon.totalCommission)}</div>
        <div class="stat-sub">Today's revenue</div>
      </div>
    </div>

    ${hasCashTopUp || hasFloatTopUp ? `
    <div class="stat-row">
      ${hasCashTopUp ? `
      <div class="stat-box g">
        <div class="stat-label">Cash Top-Up Added</div>
        <div class="stat-value g">+${fmt(recon.totalCashReplenishments)}</div>
        <div class="stat-sub">Mid-day cash injection</div>
      </div>` : '<div style="flex:1"></div>'}
      ${hasFloatTopUp ? `
      <div class="stat-box b">
        <div class="stat-label">Float Top-Up Added</div>
        <div class="stat-value b">+${fmt(recon.totalFloatReplenishments)}</div>
        <div class="stat-sub">Mid-day float injection</div>
      </div>` : '<div style="flex:1"></div>'}
      <div style="flex:1"></div>
    </div>` : ''}
  </div>

  <!-- CASH RECONCILIATION -->
  <div class="section">
    <div class="section-title">Cash Reconciliation</div>
    <div class="detail-card">
      <div class="detail-card-title">Physical Cash Calculation</div>
      <div class="detail-row">
        <div class="detail-label">Opening Cash</div>
        <div class="detail-value">${fmt(session.openingCash)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">+ Deposits (customer paid you cash)</div>
        <div class="detail-value g">+${fmt(recon.totalDeposits)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">− Withdrawals (you paid cash out)</div>
        <div class="detail-value r">−${fmt(recon.totalWithdrawals)}</div>
      </div>
      ${hasCashTopUp ? `
      <div class="detail-row">
        <div class="detail-label">+ Cash Top-Up (mid-day injection)</div>
        <div class="detail-value g">+${fmt(recon.totalCashReplenishments)}</div>
      </div>` : ''}
      <div class="detail-row total">
        <div class="detail-label">Expected Cash on Hand</div>
        <div class="detail-value b">${fmt(recon.expectedCash)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Actual Cash Counted by Agent</div>
        <div class="detail-value">${fmt(recon.actualCash)}</div>
      </div>
      <div class="detail-row result">
        <div class="detail-label">Cash Variance</div>
        <div class="detail-value bold" style="color:${vColor(recon.cashVariance)}">${vLabel(recon.cashVariance)}</div>
      </div>
    </div>
  </div>

  <!-- FLOAT RECONCILIATION -->
  <div class="section">
    <div class="section-title">Float (E-Money) Reconciliation</div>
    <div class="detail-card">
      <div class="detail-card-title">E-Money Float Calculation</div>
      <div class="detail-row">
        <div class="detail-label">Opening Float</div>
        <div class="detail-value">${fmt(session.openingFloat)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">− Deposits (you sent e-money out)</div>
        <div class="detail-value r">−${fmt(recon.totalDeposits)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">+ Withdrawals (you received e-money)</div>
        <div class="detail-value g">+${fmt(recon.totalWithdrawals)}</div>
      </div>
      ${hasFloatTopUp ? `
      <div class="detail-row">
        <div class="detail-label">+ Float Top-Up (mid-day injection)</div>
        <div class="detail-value g">+${fmt(recon.totalFloatReplenishments)}</div>
      </div>` : ''}
      <div class="detail-row total">
        <div class="detail-label">Expected Float Balance</div>
        <div class="detail-value b">${fmt(recon.expectedFloat)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Actual Float (Agent's MoMo Balance)</div>
        <div class="detail-value">${fmt(recon.actualFloat)}</div>
      </div>
      <div class="detail-row result">
        <div class="detail-label">Float Variance</div>
        <div class="detail-value bold" style="color:${vColor(recon.floatVariance)}">${vLabel(recon.floatVariance)}</div>
      </div>
    </div>
  </div>

  <!-- NET POSITION -->
  <div class="section">
    <div class="section-title">Net Position</div>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-label">Closing Cash</div>
        <div class="stat-value">${fmt(recon.actualCash)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Closing Float</div>
        <div class="stat-value">${fmt(recon.actualFloat)}</div>
      </div>
      <div class="stat-box n">
        <div class="stat-label">Total Closing Capital</div>
        <div class="stat-value">${fmt(recon.actualCash + recon.actualFloat)}</div>
      </div>
    </div>
    <div class="result-banner ${resultClass}">${resultText}</div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Agent Signature: ${agent.name}</div></div>
      <div class="sig-box"><div class="sig-line">Supervisor / Witness</div></div>
      <div class="sig-box"><div class="sig-line">Date &amp; Official Stamp</div></div>
    </div>
    <div class="footer-note">
      This document is an official reconciliation record generated by MoneyFloat &nbsp;|&nbsp;
      ${business.name} &nbsp;|&nbsp; ${now()}
    </div>
  </div>

</div>
</body>
</html>`;
};

// ─── Agent Period Statement ───────────────────────────────────────────────────

export const generatePeriodStatementHTML = (
  reconciliations: Reconciliation[],
  agent: User,
  business: Business,
  periodLabel: string
): string => {
  const totalDeposits     = reconciliations.reduce((s, r) => s + r.totalDeposits, 0);
  const totalWithdrawals  = reconciliations.reduce((s, r) => s + r.totalWithdrawals, 0);
  const totalCommission   = reconciliations.reduce((s, r) => s + r.totalCommission, 0);
  const totalCashTopUps   = reconciliations.reduce((s, r) => s + r.totalCashReplenishments, 0);
  const totalFloatTopUps  = reconciliations.reduce((s, r) => s + r.totalFloatReplenishments, 0);
  const balancedCount     = reconciliations.filter(r => Math.abs(r.cashVariance) + Math.abs(r.floatVariance) < 0.01).length;

  const rows = reconciliations.map((r, i) => {
    const balanced = Math.abs(r.cashVariance) + Math.abs(r.floatVariance) < 0.01;
    const bg = i % 2 === 0 ? '#ffffff' : '#F4F6F9';
    return `<tr style="background:${bg}">
      <td>${formatDate(r.date)}</td>
      <td class="text-g bold">${fmt(r.totalDeposits)}</td>
      <td class="text-r bold">${fmt(r.totalWithdrawals)}</td>
      <td class="text-o bold">${fmt(r.totalCommission)}</td>
      <td>${r.totalCashReplenishments > 0 ? `<span class="text-g">+${fmt(r.totalCashReplenishments)}</span>` : '—'}</td>
      <td>${r.totalFloatReplenishments > 0 ? `<span class="text-b">+${fmt(r.totalFloatReplenishments)}</span>` : '—'}</td>
      <td style="color:${vColor(r.cashVariance)}">${vLabel(r.cashVariance)}</td>
      <td style="color:${vColor(r.floatVariance)}">${vLabel(r.floatVariance)}</td>
      <td><span class="badge ${balanced ? 'badge-ok' : 'badge-var'}">${balanced ? '✓ OK' : '⚠ Var'}</span></td>
    </tr>`;
  }).join('');

  const accPct = reconciliations.length > 0
    ? Math.round((balancedCount / reconciliations.length) * 100) : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MoneyFloat Period Statement — ${periodLabel}</title>
  <style>${CSS}
    .period-table col.c-date { width: 90px; }
    .period-table col.c-dep  { width: 90px; }
    .period-table col.c-with { width: 90px; }
    .period-table col.c-comm { width: 80px; }
    .period-table col.c-cas  { width: 80px; }
    .period-table col.c-flo  { width: 80px; }
    .period-table col.c-cv   { width: 90px; }
    .period-table col.c-fv   { width: 90px; }
    .period-table col.c-st   { width: 60px; }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-top">
      <div>
        <div class="brand-name">MoneyFloat</div>
        <div class="brand-sub">Mobile Money Reconciliation System · Ghana</div>
      </div>
      <div class="doc-info">
        <div class="doc-title">Period Statement — ${periodLabel}</div>
        <div class="doc-gen">Generated: ${now()}</div>
      </div>
    </div>
    <div class="header-meta">
      <div class="meta-item"><div class="meta-label">Business</div><div class="meta-value">${business.name}</div></div>
      <div class="meta-item"><div class="meta-label">Agent</div><div class="meta-value">${agent.name}</div></div>
      <div class="meta-item"><div class="meta-label">Phone</div><div class="meta-value">${agent.phone}</div></div>
      <div class="meta-item"><div class="meta-label">Network</div><div class="meta-value">${agent.network}</div></div>
      <div class="meta-item"><div class="meta-label">Sessions</div><div class="meta-value">${reconciliations.length} days</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Period Summary</div>
    <div class="stat-row">
      <div class="stat-box g">
        <div class="stat-label">Total Deposits</div>
        <div class="stat-value g">${fmt(totalDeposits)}</div>
      </div>
      <div class="stat-box r">
        <div class="stat-label">Total Withdrawals</div>
        <div class="stat-value r">${fmt(totalWithdrawals)}</div>
      </div>
      <div class="stat-box o">
        <div class="stat-label">Total Commission</div>
        <div class="stat-value o">${fmt(totalCommission)}</div>
      </div>
    </div>
    <div class="stat-row">
      ${totalCashTopUps > 0 ? `
      <div class="stat-box g">
        <div class="stat-label">Cash Top-Ups</div>
        <div class="stat-value g">${fmt(totalCashTopUps)}</div>
      </div>` : '<div style="flex:1"></div>'}
      ${totalFloatTopUps > 0 ? `
      <div class="stat-box b">
        <div class="stat-label">Float Top-Ups</div>
        <div class="stat-value b">${fmt(totalFloatTopUps)}</div>
      </div>` : '<div style="flex:1"></div>'}
      <div class="stat-box ${accPct === 100 ? 'g' : 'o'}">
        <div class="stat-label">Accuracy</div>
        <div class="stat-value ${accPct === 100 ? 'g' : 'o'}">${accPct}%</div>
        <div class="stat-sub">${balancedCount} of ${reconciliations.length} sessions balanced</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Daily Breakdown</div>
    ${reconciliations.length === 0
      ? '<p style="color:#566573;padding:12px 0">No closed sessions in this period.</p>'
      : `<table class="period-table">
          <colgroup>
            <col class="c-date"><col class="c-dep"><col class="c-with">
            <col class="c-comm"><col class="c-cas"><col class="c-flo">
            <col class="c-cv"><col class="c-fv"><col class="c-st">
          </colgroup>
          <thead><tr>
            <th>Date</th><th>Deposits</th><th>Withdrawals</th><th>Commission</th>
            <th>Cash T/U</th><th>Float T/U</th>
            <th>Cash Var.</th><th>Float Var.</th><th>Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr>
            <td>TOTAL</td>
            <td>${fmt(totalDeposits)}</td>
            <td>${fmt(totalWithdrawals)}</td>
            <td>${fmt(totalCommission)}</td>
            <td>${totalCashTopUps > 0 ? fmt(totalCashTopUps) : '—'}</td>
            <td>${totalFloatTopUps > 0 ? fmt(totalFloatTopUps) : '—'}</td>
            <td colspan="2"></td>
            <td>${balancedCount}/${reconciliations.length}</td>
          </tr></tfoot>
        </table>`}
  </div>

  <div class="footer">
    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Agent Signature: ${agent.name}</div></div>
      <div class="sig-box"><div class="sig-line">Supervisor / Reviewer</div></div>
      <div class="sig-box"><div class="sig-line">Date &amp; Official Stamp</div></div>
    </div>
    <div class="footer-note">
      MoneyFloat Period Statement &nbsp;|&nbsp; ${business.name} &nbsp;|&nbsp; ${now()}
    </div>
  </div>

</div>
</body>
</html>`;
};

// ─── Business Statement (Admin) ───────────────────────────────────────────────

export const generateBusinessStatementHTML = (
  reconciliations: Reconciliation[],
  agentMap: Record<string, User>,
  business: Business,
  periodLabel: string
): string => {
  const totalDeposits    = reconciliations.reduce((s, r) => s + r.totalDeposits, 0);
  const totalWithdrawals = reconciliations.reduce((s, r) => s + r.totalWithdrawals, 0);
  const totalCommission  = reconciliations.reduce((s, r) => s + r.totalCommission, 0);
  const balancedCount    = reconciliations.filter(r => Math.abs(r.cashVariance) + Math.abs(r.floatVariance) < 0.01).length;

  const rows = reconciliations.map((r, i) => {
    const agent    = agentMap[r.agentId];
    const balanced = Math.abs(r.cashVariance) + Math.abs(r.floatVariance) < 0.01;
    const bg = i % 2 === 0 ? '#ffffff' : '#F4F6F9';
    return `<tr style="background:${bg}">
      <td>${formatDate(r.date)}</td>
      <td>${agent?.name ?? 'Unknown'}</td>
      <td>${agent?.network ?? '—'}</td>
      <td class="text-g bold">${fmt(r.totalDeposits)}</td>
      <td class="text-r bold">${fmt(r.totalWithdrawals)}</td>
      <td class="text-o bold">${fmt(r.totalCommission)}</td>
      <td style="color:${vColor(r.cashVariance)}">${vLabel(r.cashVariance)}</td>
      <td style="color:${vColor(r.floatVariance)}">${vLabel(r.floatVariance)}</td>
      <td><span class="badge ${balanced ? 'badge-ok' : 'badge-var'}">${balanced ? '✓ OK' : '⚠ Var'}</span></td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MoneyFloat Business Statement</title>
  <style>${CSS}
    .biz-table col.c-date { width: 80px; }
    .biz-table col.c-agent{ width: 100px; }
    .biz-table col.c-net  { width: 65px; }
    .biz-table col.c-dep  { width: 85px; }
    .biz-table col.c-with { width: 85px; }
    .biz-table col.c-comm { width: 75px; }
    .biz-table col.c-cv   { width: 85px; }
    .biz-table col.c-fv   { width: 85px; }
    .biz-table col.c-st   { width: 50px; }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-top">
      <div>
        <div class="brand-name">MoneyFloat</div>
        <div class="brand-sub">Mobile Money Reconciliation System · Ghana</div>
      </div>
      <div class="doc-info">
        <div class="doc-title">Business Statement — ${periodLabel}</div>
        <div class="doc-gen">Generated: ${now()}</div>
      </div>
    </div>
    <div class="header-meta">
      <div class="meta-item"><div class="meta-label">Business</div><div class="meta-value">${business.name}</div></div>
      <div class="meta-item"><div class="meta-label">Total Agents</div><div class="meta-value">${Object.keys(agentMap).length}</div></div>
      <div class="meta-item"><div class="meta-label">Total Sessions</div><div class="meta-value">${reconciliations.length}</div></div>
      <div class="meta-item"><div class="meta-label">Balanced</div><div class="meta-value">${balancedCount} / ${reconciliations.length}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Business Summary</div>
    <div class="stat-row">
      <div class="stat-box g">
        <div class="stat-label">Total Deposits</div>
        <div class="stat-value g">${fmt(totalDeposits)}</div>
        <div class="stat-sub">All agents combined</div>
      </div>
      <div class="stat-box r">
        <div class="stat-label">Total Withdrawals</div>
        <div class="stat-value r">${fmt(totalWithdrawals)}</div>
        <div class="stat-sub">All agents combined</div>
      </div>
      <div class="stat-box o">
        <div class="stat-label">Total Commission</div>
        <div class="stat-value o">${fmt(totalCommission)}</div>
        <div class="stat-sub">Total revenue earned</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">All Reconciliation Sessions</div>
    ${reconciliations.length === 0
      ? '<p style="color:#566573;padding:12px 0">No reconciliations found.</p>'
      : `<table class="biz-table">
          <colgroup>
            <col class="c-date"><col class="c-agent"><col class="c-net">
            <col class="c-dep"><col class="c-with"><col class="c-comm">
            <col class="c-cv"><col class="c-fv"><col class="c-st">
          </colgroup>
          <thead><tr>
            <th>Date</th><th>Agent</th><th>Network</th>
            <th>Deposits</th><th>Withdrawals</th><th>Commission</th>
            <th>Cash Var.</th><th>Float Var.</th><th>Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr>
            <td colspan="3">TOTAL</td>
            <td>${fmt(totalDeposits)}</td>
            <td>${fmt(totalWithdrawals)}</td>
            <td>${fmt(totalCommission)}</td>
            <td colspan="2"></td>
            <td>${balancedCount}/${reconciliations.length}</td>
          </tr></tfoot>
        </table>`}
  </div>

  <div class="footer">
    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Admin / Owner Signature</div></div>
      <div class="sig-box"><div class="sig-line">Reviewer</div></div>
      <div class="sig-box"><div class="sig-line">Date &amp; Official Stamp</div></div>
    </div>
    <div class="footer-note">
      MoneyFloat Business Statement &nbsp;|&nbsp; ${business.name} &nbsp;|&nbsp; ${now()}
    </div>
  </div>

</div>
</body>
</html>`;
};
