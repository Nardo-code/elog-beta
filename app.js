const starterTrades = [
  { id: 'sample-1', market: 'Stocks', symbol: 'NVDA', direction: 'Long', setup: 'Opening range break', date: 'Jul 14', createdAt: '2026-07-14T14:30:00.000Z', result: 642.50, ret: 3.8 },
  { id: 'sample-2', market: 'Options', symbol: 'SPY 610C', direction: 'Long', setup: 'Trend pullback', date: 'Jul 12', createdAt: '2026-07-12T15:05:00.000Z', result: 385.00, ret: 2.4 },
  { id: 'sample-3', market: 'Futures', symbol: 'NQ', direction: 'Short', setup: 'Liquidity sweep', date: 'Jul 10', createdAt: '2026-07-10T13:55:00.000Z', result: -175.00, ret: -0.8 },
  { id: 'sample-4', market: 'Forex', symbol: 'EUR/USD', direction: 'Long', setup: 'London breakout', date: 'Jul 8', createdAt: '2026-07-08T08:20:00.000Z', result: 290.00, ret: 1.7 },
  { id: 'sample-5', market: 'Stocks', symbol: 'TSLA', direction: 'Short', setup: 'Failed breakout', date: 'Jul 7', createdAt: '2026-07-07T16:10:00.000Z', result: 515.00, ret: 2.9 },
  { id: 'sample-6', market: 'Options', symbol: 'QQQ 552P', direction: 'Long', setup: 'Reversal', date: 'Jul 3', createdAt: '2026-07-03T14:45:00.000Z', result: -110.00, ret: -0.6 }
];

const defaultTemplates = [
  { market: 'Stocks', name: 'Opening range break', criteria: ['Breakout confirmed', 'Volume confirmation'] },
  { market: 'Stocks', name: 'VWAP reclaim', criteria: ['VWAP reclaim', 'Volume confirmation'] },
  { market: 'Options', name: 'Trend pullback', criteria: ['Underlying setup', 'Delta selected', 'Liquidity / OI'] },
  { market: 'Futures', name: 'Liquidity sweep', criteria: ['Higher-timeframe bias', 'Liquidity sweep', 'Session level'] },
  { market: 'Forex', name: 'London breakout', criteria: ['Higher-timeframe bias', 'Session breakout', 'News checked'] }
];

const defaultFutures = [
  { symbol: 'ES', name: 'E-mini S&P 500', tickSize: 0.25, tickValue: 12.50 },
  { symbol: 'MES', name: 'Micro E-mini S&P 500', tickSize: 0.25, tickValue: 1.25 },
  { symbol: 'NQ', name: 'E-mini Nasdaq-100', tickSize: 0.25, tickValue: 5.00 },
  { symbol: 'MNQ', name: 'Micro E-mini Nasdaq-100', tickSize: 0.25, tickValue: 0.50 },
  { symbol: 'CL', name: 'Crude Oil', tickSize: 0.01, tickValue: 10.00 },
  { symbol: 'GC', name: 'Gold', tickSize: 0.10, tickValue: 10.00 }
];

const defaultSessions = [
  { name: 'New York', start: '09:30', end: '16:00', timezone: 'America/New_York' },
  { name: 'London', start: '08:00', end: '16:30', timezone: 'Europe/London' },
  { name: 'Tokyo', start: '09:00', end: '15:00', timezone: 'Asia/Tokyo' }
];
const defaultRules = [
  { id: 'rule-risk-1', category: 'Risk', market: 'All markets', name: 'Maximum 1% account risk', description: 'Total planned loss at the stop cannot exceed 1% of account equity.', severity: 'Hard rule', reason: 'Protect capital', active: true },
  { id: 'rule-risk-2', category: 'Risk', market: 'All markets', name: 'Stop defined before entry', description: 'A technical invalidation level and stop price must be chosen before entering.', severity: 'Hard rule', reason: 'Avoid uncontrolled losses', active: true },
  { id: 'rule-entry-1', category: 'Entry', market: 'All markets', name: 'No chasing extended price', description: 'Skip the entry if price has already moved beyond the planned entry zone.', severity: 'Guideline', reason: 'Improve entry quality', active: true },
  { id: 'rule-mind-1', category: 'Psychology', market: 'All markets', name: 'Stop after daily loss limit', description: 'Do not open another position after reaching the defined daily loss limit.', severity: 'Hard rule', reason: 'Prevent revenge trading', active: true }
];
const CONSENT_VERSION = '1.0';
const APP_VERSION = 'Prototype MK1';
const defaultProfile = { name: 'Dimechio', currency: 'USD', timezone: 'America/Bogota', avatar: '' };
const defaultAccounts = [{ id: 'account-primary', name: 'Main trading', broker: '', startingBalance: 25000, currency: 'USD' }];

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const readStore = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
  catch { return fallback; }
};
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const money = value => `${Number(value) >= 0 ? '+' : '-'}${new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Math.abs(Number(value || 0)))}`;

let trades = readStore('edgelog-trades', starterTrades).map((trade, index) => ({ id: trade.id || `legacy-${index}`, ...trade }));
let setupTemplates = readStore('edgelog-setup-templates', defaultTemplates);
let futuresContracts = readStore('edgelog-futures-contracts', defaultFutures);
let tradingSessions = readStore('edgelog-trading-sessions', defaultSessions);
let tradingRules = readStore('edgelog-trading-rules', defaultRules);
let defaultSession = localStorage.getItem('edgelog-default-session') || 'New York';
let securityCredentials = readStore('edgelog-security', null);
let privacyConsent = readStore('edgelog-consent', null);
let userProfile = readStore('edgelog-profile', defaultProfile);
let tradingAccounts = readStore('edgelog-accounts', defaultAccounts);
let cashAdjustments = readStore('edgelog-cash-adjustments', []);
if (!tradingAccounts.length) tradingAccounts = defaultAccounts.map(account => ({ ...account }));
let currentRuleFilter = 'All';
let selectedTradeIds = new Set();
let editingTradeId = null;
let sidebarCompact = localStorage.getItem('edgelog-sidebar-compact') === 'true';
let tabAnimationsEnabled = localStorage.getItem('edgelog-tab-animations') !== 'false';
const currencyMoney = value => new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile.currency || 'USD' }).format(Number(value || 0));
trades.forEach(trade => {
  const alreadySaved = setupTemplates.some(template => template.market === trade.market && template.name.toLowerCase() === trade.setup.toLowerCase());
  if (!alreadySaved) setupTemplates.push({ market: trade.market, name: trade.setup, criteria: trade.criteria || [] });
});
localStorage.setItem('edgelog-setup-templates', JSON.stringify(setupTemplates));

function chartButtons(trade) {
  const buttons = [];
  if (trade.preImage) buttons.push(`<button class="trade-shot" data-trade-id="${esc(trade.id)}" data-shot="pre">PRE</button>`);
  if (trade.postImage) buttons.push(`<button class="trade-shot" data-trade-id="${esc(trade.id)}" data-shot="post">POST</button>`);
  return buttons.length ? `<div class="trade-shots">${buttons.join('')}</div>` : '<span class="muted-dash">-</span>';
}

function renderRows(target, list, full = false) {
  if (!list.length) {
    target.innerHTML = `<tr><td colspan="${full ? 13 : 7}"><div class="journal-empty"><strong>No trades here yet</strong><span>Log a trade or adjust the filters to begin tracking.</span></div></td></tr>`;
    return;
  }
  target.innerHTML = list.map(trade => `<tr>
    ${full ? `<td><input class="trade-select" type="checkbox" data-trade-id="${esc(trade.id)}" aria-label="Select ${esc(trade.symbol)}" ${selectedTradeIds.has(trade.id) ? 'checked' : ''}></td>` : ''}
    <td><span class="market-dot">${esc(trade.market.slice(0, 2).toUpperCase())}</span>${esc(trade.market)}</td>
    <td><strong class="symbol">${esc(trade.symbol)}</strong>${trade.status === 'Open' ? '<span class="trade-status open">OPEN</span>' : ''}${String(trade.id).startsWith('sample-') ? '<span class="demo-badge">DEMO</span>' : ''}</td>
    ${full ? `<td>${esc(trade.direction)}</td><td>${esc(trade.session || '-')}</td><td>${trade.entry ?? '-'}</td><td>${trade.exit ?? '-'}</td><td>${chartButtons(trade)}</td>` : ''}
    <td>${esc(trade.setup)}</td><td>${esc(trade.date)}</td>
    <td class="${trade.result >= 0 ? 'result-positive' : 'result-negative'}">${money(trade.result)}</td>
    <td class="${trade.ret >= 0 ? 'result-positive' : 'result-negative'}">${trade.ret >= 0 ? '+' : ''}${trade.ret}%${trade.actualR != null ? `<small class="r-multiple">${trade.actualR}R</small>` : ''}</td>
    <td><div class="trade-row-actions"><button class="trade-edit" data-trade-id="${esc(trade.id)}">Edit</button><button class="trade-delete" data-trade-id="${esc(trade.id)}">Delete</button></div></td>
  </tr>`).join('');
}

function renderAnalytics() {
  const recent = trades.slice(0, 12).reverse();
  const pnlChart = $('#trade-pnl-chart');
  if (!recent.length) {
    pnlChart.innerHTML = '<div class="empty-analytics">Log a trade to build your P&L chart.</div>';
  } else {
    const maxResult = Math.max(...recent.map(trade => Math.abs(trade.result)), 1);
    pnlChart.innerHTML = recent.map(trade => {
      const height = Math.max(6, Math.abs(trade.result) / maxResult * 165);
      return `<div class="pnl-column"><div class="pnl-bar ${trade.result < 0 ? 'negative' : ''}" style="height:${height}px"><span class="bar-value">${trade.result >= 0 ? '+' : '-'}$${Math.round(Math.abs(trade.result))}</span></div><small title="${esc(trade.symbol)}">${esc(trade.symbol)}</small></div>`;
    }).join('');
  }

  const wins = trades.filter(trade => trade.result > 0).length;
  const losses = trades.filter(trade => trade.result < 0).length;
  const flat = trades.length - wins - losses;
  const total = Math.max(trades.length, 1);
  const winEnd = wins / total * 100;
  const lossEnd = (wins + losses) / total * 100;
  $('#outcome-chart').innerHTML = `<div class="outcome-donut" style="background:conic-gradient(#73b44a 0 ${winEnd}%,#d26a6a ${winEnd}% ${lossEnd}%,#d9ddd7 ${lossEnd}% 100%)"><span><strong>${trades.length}</strong><small>Total trades</small></span></div><div class="outcome-legend"><span><i style="background:#73b44a"></i><small>Wins</small><strong>${wins}</strong></span><span><i style="background:#d26a6a"></i><small>Losses</small><strong>${losses}</strong></span><span><i style="background:#d9ddd7"></i><small>Breakeven</small><strong>${flat}</strong></span></div>`;

  const sessions = new Map();
  trades.forEach(trade => {
    const name = trade.session || 'Unspecified';
    sessions.set(name, (sessions.get(name) || 0) + trade.result);
  });
  const sessionRows = [...sessions.entries()].sort((a, b) => b[1] - a[1]);
  const maxSession = Math.max(...sessionRows.map(([, value]) => Math.abs(value)), 1);
  $('#session-performance').innerHTML = sessionRows.length ? sessionRows.map(([name, value]) => `<div class="breakdown-row"><span title="${esc(name)}">${esc(name)}</span><div class="breakdown-track"><i class="${value < 0 ? 'negative' : ''}" style="width:${Math.max(4, Math.abs(value) / maxSession * 100)}%"></i></div><strong class="${value >= 0 ? 'result-positive' : 'result-negative'}">${money(value)}</strong></div>`).join('') : '<div class="empty-analytics">Session results appear after trades are logged.</div>';

  const setups = new Map();
  trades.forEach(trade => {
    const current = setups.get(trade.setup) || { count: 0, wins: 0, pnl: 0 };
    current.count += 1;
    current.wins += trade.result > 0 ? 1 : 0;
    current.pnl += trade.result;
    setups.set(trade.setup, current);
  });
  const setupRows = [...setups.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 7);
  $('#setup-performance').innerHTML = setupRows.length ? setupRows.map(([name, data]) => `<div class="setup-analytics-row"><strong title="${esc(name)}">${esc(name)}</strong><span class="setup-count">${data.count} trades</span><span>${(data.wins / data.count * 100).toFixed(0)}% win</span><span class="${data.pnl >= 0 ? 'result-positive' : 'result-negative'}">${money(data.pnl / data.count)} avg</span></div>`).join('') : '<div class="empty-analytics">Setup statistics appear after trades are logged.</div>';
}

function allRuleResults() {
  return trades.flatMap(trade => Array.isArray(trade.ruleResults) ? trade.ruleResults : []);
}

function renderTradeRuleChecklist() {
  const market = tradeForm?.elements.market.value || 'Stocks';
  const applicable = tradingRules.filter(rule => rule.active && (rule.market === 'All markets' || rule.market === market));
  $('#trade-rule-checklist').innerHTML = applicable.length ? applicable.map(rule => `<label class="trade-rule-check"><input type="checkbox" data-rule-id="${esc(rule.id)}" checked><span><strong>${esc(rule.name)}</strong><small>${esc(rule.category)} · ${esc(rule.severity)}</small></span></label>`).join('') : '<div class="empty-rule-checklist">No active rules apply. Add one from the Trading Rules tab.</div>';
}

function renderRules() {
  const activeRules = tradingRules.filter(rule => rule.active);
  const results = allRuleResults();
  const followed = results.filter(result => result.followed).length;
  const breaks = results.filter(result => !result.followed);
  const adherence = results.length ? followed / results.length * 100 : null;
  $('#active-rule-count').textContent = activeRules.length;
  $('#rule-adherence').textContent = adherence === null ? '—' : `${adherence.toFixed(0)}%`;

  const brokenCounts = new Map();
  breaks.forEach(result => brokenCounts.set(result.ruleId, (brokenCounts.get(result.ruleId) || 0) + 1));
  const mostBroken = [...brokenCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (mostBroken) {
    const rule = tradingRules.find(item => item.id === mostBroken[0]);
    $('#most-broken-rule').textContent = rule?.name || 'Deleted rule';
    $('#most-broken-count').textContent = `${mostBroken[1]} recorded violation${mostBroken[1] === 1 ? '' : 's'}`;
  } else {
    $('#most-broken-rule').textContent = 'No data yet';
    $('#most-broken-count').textContent = 'Start checking rules on trades';
  }

  const score = adherence === null ? null : Math.round(adherence);
  $('#discipline-score').textContent = score === null ? '—' : score;
  $('#rule-break-count').textContent = results.length ? `${breaks.length} rule break${breaks.length === 1 ? '' : 's'} across ${results.length} checks` : 'Log rules with trades to begin';
  $('#discipline-track').style.width = `${score ?? 0}%`;
  $('#discipline-label').textContent = score === null ? 'Not tracked' : score >= 90 ? 'Excellent' : score >= 75 ? 'On track' : 'Needs focus';
  $('#discipline-label').classList.toggle('positive', score !== null && score >= 90);
  $('#discipline-label').classList.toggle('warning', score === null || score < 90);

  const visibleRules = tradingRules.filter(rule => currentRuleFilter === 'All' || rule.category === currentRuleFilter);
  $('#rules-grid').innerHTML = visibleRules.length ? visibleRules.map(rule => `<article class="rule-card ${rule.active ? '' : 'inactive'}" data-rule-id="${esc(rule.id)}"><div class="rule-card-top"><span class="rule-category ${rule.category.toLowerCase()}">${esc(rule.category)}</span><span class="rule-severity">${esc(rule.severity)}</span></div><h2>${esc(rule.name)}</h2><p>${esc(rule.description)}</p><div class="rule-meta"><span><small>Applies to</small><strong>${esc(rule.market)}</strong></span><span><small>Purpose</small><strong>${esc(rule.reason || 'Consistency')}</strong></span></div><div class="rule-card-actions"><button class="rule-toggle" data-action="toggle">${rule.active ? 'Active' : 'Paused'}</button><button class="rule-delete" data-action="delete">Delete</button></div></article>`).join('') : '<div class="empty-analytics">No rules in this category yet.</div>';
  $('#rules-grid').querySelectorAll('.rule-delete').forEach(button => { button.textContent = 'Remove rule'; });
  renderTradeRuleChecklist();
}

function parsedTradeDate(trade, fallbackIndex = 0) {
  if (trade.createdAt) {
    const timestamp = new Date(trade.createdAt);
    if (!Number.isNaN(timestamp.getTime())) return timestamp;
  }
  const value = String(trade.date || '');
  const withYear = /\b\d{4}\b/.test(value) ? value : `${value}, ${new Date().getFullYear()}`;
  const parsed = new Date(withYear);
  return Number.isNaN(parsed.getTime()) ? new Date(Date.now() - fallbackIndex * 86400000) : parsed;
}

function toDateTimeLocal(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function overviewTradesForPeriod() {
  const period = $('#period-select').value;
  const now = new Date();
  if (period === 'All time') return [...trades];
  if (period === 'Custom range') {
    const fromValue = $('#overview-date-from').value;
    const toValue = $('#overview-date-to').value;
    const from = fromValue ? new Date(`${fromValue}T00:00:00`) : new Date(0);
    const to = toValue ? new Date(`${toValue}T23:59:59`) : new Date(8640000000000000);
    return trades.filter((trade, index) => { const date = parsedTradeDate(trade, index); return date >= from && date <= to; });
  }
  if (period === 'Last 30 days') {
    const cutoff = new Date(now.getTime() - 30 * 86400000);
    return trades.filter((trade, index) => parsedTradeDate(trade, index) >= cutoff);
  }
  return trades.filter((trade, index) => {
    const date = parsedTradeDate(trade, index);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
}

function axisMoney(value) {
  const absolute = Math.abs(value);
  const compact = absolute >= 1000 ? `${(absolute / 1000).toFixed(absolute >= 10000 ? 0 : 1)}k` : absolute.toFixed(0);
  return `${value < 0 ? '-' : ''}$${compact}`;
}

function buildCurve(list, width, height, padding = 10) {
  const ordered = [...list].sort((a, b) => parsedTradeDate(a).getTime() - parsedTradeDate(b).getTime());
  const cumulative = [0];
  ordered.forEach(trade => cumulative.push(cumulative[cumulative.length - 1] + Number(trade.result || 0)));
  const rawMin = Math.min(...cumulative, 0);
  const rawMax = Math.max(...cumulative, 0);
  const span = Math.max(rawMax - rawMin, 1);
  const min = rawMin - span * .12;
  const max = rawMax + span * .12;
  const x = index => cumulative.length === 1 ? 0 : index / (cumulative.length - 1) * width;
  const y = value => padding + (max - value) / (max - min) * (height - padding * 2);
  const line = cumulative.map((value, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  const zeroY = y(0).toFixed(1);
  const area = `${line} L${width},${zeroY} L0,${zeroY} Z`;
  return { ordered, cumulative, min, max, line, area, zeroY };
}

function renderOverview() {
  const scopedTrades = overviewTradesForPeriod();
  const periodTrades = scopedTrades.filter(trade => trade.status !== 'Open');
  const wins = periodTrades.filter(trade => Number(trade.result) > 0);
  const losses = periodTrades.filter(trade => Number(trade.result) < 0);
  const total = periodTrades.reduce((sum, trade) => sum + Number(trade.result || 0), 0);
  const grossWin = wins.reduce((sum, trade) => sum + Number(trade.result || 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + Number(trade.result || 0), 0));
  const winRate = periodTrades.length ? wins.length / periodTrades.length * 100 : 0;

  const startingBalance = tradingAccounts.reduce((sum, account) => sum + Number(account.startingBalance || 0), 0);
  const cashFlow = cashAdjustments.reduce((sum, item) => sum + (item.type === 'withdrawal' ? -1 : 1) * Number(item.amount || 0), 0);
  const closedPnl = trades.filter(trade => trade.status !== 'Open').reduce((sum, trade) => sum + Number(trade.result || 0), 0);
  $('#account-starting').textContent = currencyMoney(startingBalance);
  $('#account-cash-flow').textContent = currencyMoney(cashFlow);
  $('#account-equity').textContent = currencyMoney(startingBalance + cashFlow + closedPnl);
  $('#account-equity-note').textContent = `${tradingAccounts.length} account${tradingAccounts.length === 1 ? '' : 's'} · includes closed P&L`;
  $('#open-trade-count').textContent = trades.filter(trade => trade.status === 'Open').length;

  $('#net-pnl').textContent = money(total);
  const featured = $('.metric-card.featured');
  featured.querySelector('.pill').textContent = `${periodTrades.length} closed trade${periodTrades.length === 1 ? '' : 's'}`;
  featured.querySelector('.pill').className = `pill ${total >= 0 ? 'positive' : 'warning'}`;
  featured.querySelector('small').textContent = `${wins.length} winning · ${losses.length} losing · ${periodTrades.length - wins.length - losses.length} breakeven`;

  const metricCurve = buildCurve(periodTrades, 320, 76, 4);
  featured.querySelector('.sparkline').innerHTML = periodTrades.length ? `<svg viewBox="0 0 320 80" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b5ff5b" stop-opacity=".28"/><stop offset="1" stop-color="#b5ff5b" stop-opacity="0"/></linearGradient></defs><path class="area" d="${metricCurve.area}"/><path d="${metricCurve.line}"/></svg>` : '';

  $('#win-rate').textContent = `${winRate.toFixed(1)}%`;
  const winCard = $('#win-rate').closest('.metric-card');
  winCard.querySelector('small').textContent = `${wins.length} wins from ${periodTrades.length} posted trade${periodTrades.length === 1 ? '' : 's'}`;
  winCard.querySelector('.donut').style.setProperty('--value', winRate.toFixed(1));
  winCard.querySelector('.donut span').textContent = `${Math.round(winRate)}%`;

  const profitFactor = grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : null;
  $('#profit-factor').textContent = profitFactor === Infinity ? '∞' : profitFactor === null ? '—' : profitFactor.toFixed(2);
  const profitCard = $('#profit-factor').closest('.metric-card');
  profitCard.querySelector('small').textContent = profitFactor === Infinity ? 'No losing trades in this selection' : profitFactor === null ? 'Log trades to calculate profit factor' : `For every $1 lost, gross profit is $${profitFactor.toFixed(2)}`;
  const recentResults = periodTrades.slice(0, 7).reverse();
  const resultMax = Math.max(...recentResults.map(trade => Math.abs(Number(trade.result || 0))), 1);
  profitCard.querySelector('.mini-bars').innerHTML = recentResults.map(trade => `<i style="height:${Math.max(12, Math.abs(Number(trade.result || 0)) / resultMax * 100)}%;background:${Number(trade.result) >= 0 ? '#9dde52' : '#d26a6a'}"></i>`).join('');

  const market = $('#curve-market-filter').value;
  const curveTrades = periodTrades.filter(trade => market === 'all' || trade.market === market);
  $('#curve-description').textContent = `${market === 'all' ? 'All markets' : market} · ${curveTrades.length} saved trade${curveTrades.length === 1 ? '' : 's'}`;
  const chart = $('.large-chart');
  if (!curveTrades.length) {
    chart.innerHTML = '<div class="overview-empty">No posted trades match this period and market.</div>';
  } else {
    const curve = buildCurve(curveTrades, 700, 220, 8);
    const axisValues = [curve.max, curve.max - (curve.max - curve.min) / 3, curve.max - (curve.max - curve.min) * 2 / 3, curve.min];
    const dateIndexes = [...new Set([0, Math.floor((curve.ordered.length - 1) * .25), Math.floor((curve.ordered.length - 1) * .5), Math.floor((curve.ordered.length - 1) * .75), curve.ordered.length - 1])];
    const dates = dateIndexes.map(index => `<span>${esc(curve.ordered[index].date)}</span>`).join('');
    chart.innerHTML = `<div class="axis">${axisValues.map(value => `<span>${axisMoney(value)}</span>`).join('')}</div><svg viewBox="0 0 700 240" preserveAspectRatio="none"><defs><linearGradient id="largeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8f34a" stop-opacity=".2"/><stop offset="1" stop-color="#a8f34a" stop-opacity="0"/></linearGradient></defs><path class="grid" d="M0 8H700 M0 78H700 M0 148H700 M0 218H700"/><path class="zero-line" d="M0 ${curve.zeroY}H700"/><path class="chart-area" d="${curve.area}"/><path class="chart-line" d="${curve.line}"/></svg><div class="dates">${dates}</div>`;
  }

  const summarizeGroup = key => {
    const groups = new Map();
    periodTrades.forEach(trade => {
      const name = trade[key] || 'Unspecified';
      const current = groups.get(name) || { pnl: 0, count: 0, wins: 0 };
      current.pnl += Number(trade.result || 0);
      current.count += 1;
      current.wins += Number(trade.result) > 0 ? 1 : 0;
      groups.set(name, current);
    });
    return [...groups.entries()].sort((a, b) => b[1].pnl - a[1].pnl)[0];
  };
  const bestSession = summarizeGroup('session');
  const bestSetup = summarizeGroup('setup');
  const insight = $('.insight-panel');
  insight.querySelector('.ai-badge').textContent = '✦ TRADE DATA REVIEW';
  insight.querySelector('h2').textContent = bestSession ? `${bestSession[0]} is your strongest session.` : 'Your trade review is waiting.';
  insight.querySelector(':scope > p').innerHTML = bestSession ? `<strong>${bestSession[1].count}</strong> posted trade${bestSession[1].count === 1 ? '' : 's'} produced <strong>${money(bestSession[1].pnl)}</strong> with a <strong>${(bestSession[1].wins / bestSession[1].count * 100).toFixed(0)}% win rate</strong>.` : 'Post trades to generate session and setup insights from your own journal.';
  const insightStats = insight.querySelectorAll('.insight-stat strong');
  insightStats[0].textContent = bestSession?.[0] || 'Not enough data';
  insightStats[1].textContent = bestSetup?.[0] || 'Not enough data';
}

function renderAccountSettings() {
  $('#account-list').innerHTML = tradingAccounts.map(account => `<div class="account-row" data-account-id="${esc(account.id)}"><span><strong>${esc(account.name)}</strong><small>${esc(account.broker || 'No broker')} · ${esc(account.currency)}</small></span><b>${currencyMoney(account.startingBalance)}</b><button class="delete-account" type="button">Remove</button></div>`).join('');
  const options = tradingAccounts.map(account => `<option value="${esc(account.id)}">${esc(account.name)}</option>`).join('');
  $('#trade-account').innerHTML = options;
  $('#cash-adjustment-form').elements.accountId.innerHTML = options;
  const form = $('#profile-form');
  form.elements.name.value = userProfile.name || '';
  form.elements.currency.value = userProfile.currency || 'USD';
  form.elements.timezone.value = userProfile.timezone || 'America/Bogota';
  const profileName = $('.profile strong');
  profileName.textContent = userProfile.name || 'Trader';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  $('#dashboard .page-heading h1').textContent = `${greeting}, ${userProfile.name || 'Trader'}.`;
  const initials = (userProfile.name || 'Trader').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const avatar = $('.avatar');
  avatar.textContent = userProfile.avatar ? '' : initials;
  avatar.style.backgroundImage = userProfile.avatar ? `url(${userProfile.avatar})` : '';
}

function renderCashActivity() {
  $('#cash-activity-list').innerHTML = cashAdjustments.length ? cashAdjustments.slice(0, 8).map(item => `<div class="cash-row" data-cash-id="${esc(item.id)}"><span><strong>${item.type === 'withdrawal' ? 'Withdrawal' : 'Deposit'}</strong><small>${esc(item.date)} · ${esc(item.note || 'No note')}</small></span><b class="${item.type === 'withdrawal' ? 'result-negative' : 'result-positive'}">${item.type === 'withdrawal' ? '-' : '+'}${currencyMoney(item.amount)}</b><button type="button">Remove</button></div>`).join('') : '<div class="backup-empty">No deposits or withdrawals recorded.</div>';
}

function render() {
  renderRows($('#recent-trades'), trades.slice(0, 5));
  renderRows($('#journal-trades'), trades, true);
  $('#trade-count-side').textContent = trades.length;
  renderOverview();
  const markets = ['Stocks', 'Options', 'Futures', 'Forex'];
  const totals = markets.map(market => trades.filter(trade => trade.market === market).reduce((sum, trade) => sum + trade.result, 0));
  const max = Math.max(...totals, 1);
  $('#market-performance').innerHTML = markets.map((market, index) => `<div class="performance-row"><strong>${market}</strong><div class="bar"><i style="width:${Math.max(4, totals[index] / max * 100)}%"></i></div><span class="${totals[index] >= 0 ? 'result-positive' : 'result-negative'}">${money(totals[index])}</span></div>`).join('');
  renderAnalytics();
  renderRules();
  updateBulkActions();
}

function updateCustomRangeVisibility() {
  $('.reporting-controls').classList.toggle('custom-active', $('#period-select').value === 'Custom range');
  renderOverview();
}
$('#period-select').addEventListener('change', updateCustomRangeVisibility);
$('#overview-date-from').addEventListener('change', renderOverview);
$('#overview-date-to').addEventListener('change', renderOverview);
$('#curve-market-filter').addEventListener('change', renderOverview);

$('#profile-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.target);
  const avatarFile = event.target.elements.avatar.files[0];
  userProfile = { ...userProfile, name: form.get('name').trim(), currency: form.get('currency'), timezone: form.get('timezone').trim(), avatar: avatarFile ? await compressImage(avatarFile) : userProfile.avatar };
  localStorage.setItem('edgelog-profile', JSON.stringify(userProfile));
  renderAccountSettings();
  renderOverview();
  toast('Profile and reporting preferences saved');
});

$('#account-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.target);
  tradingAccounts.push({ id: `account-${Date.now()}`, name: form.get('name').trim(), broker: form.get('broker').trim(), startingBalance: Number(form.get('startingBalance')), currency: form.get('currency') });
  localStorage.setItem('edgelog-accounts', JSON.stringify(tradingAccounts));
  event.target.reset();
  renderAccountSettings(); renderOverview(); toast('Trading account added');
});

$('#account-list').addEventListener('click', event => {
  const row = event.target.closest('[data-account-id]');
  if (!row || !event.target.closest('.delete-account')) return;
  if (tradingAccounts.length === 1) { toast('Keep at least one trading account'); return; }
  if (!window.confirm('Remove this account? Existing trades will remain in the journal.')) return;
  tradingAccounts = tradingAccounts.filter(account => account.id !== row.dataset.accountId);
  localStorage.setItem('edgelog-accounts', JSON.stringify(tradingAccounts));
  renderAccountSettings(); renderOverview();
});

$('#cash-adjustment-form').addEventListener('submit', event => {
  event.preventDefault(); const form = new FormData(event.target);
  cashAdjustments.unshift({ id: `cash-${Date.now()}`, accountId: form.get('accountId'), type: form.get('type'), amount: Number(form.get('amount')), date: form.get('date'), note: form.get('note').trim() });
  localStorage.setItem('edgelog-cash-adjustments', JSON.stringify(cashAdjustments));
  event.target.reset(); event.target.elements.date.valueAsDate = new Date();
  renderCashActivity(); renderOverview(); toast('Cash activity recorded');
});

$('#cash-activity-list').addEventListener('click', event => {
  const row = event.target.closest('[data-cash-id]'); if (!row || !event.target.closest('button')) return;
  cashAdjustments = cashAdjustments.filter(item => item.id !== row.dataset.cashId);
  localStorage.setItem('edgelog-cash-adjustments', JSON.stringify(cashAdjustments)); renderCashActivity(); renderOverview();
});

function animateBrand() {
  const brand = $('#animated-brand');
  brand.classList.remove('reveal');
  void brand.offsetWidth;
  brand.classList.add('reveal');
  const mark = brand.querySelector('.balloon-mark');
  const word = brand.querySelector('.brand-word');
  const home = brand.querySelector('.brand-return');
  if (mark.animate) {
    mark.animate([
      { transform: 'rotate(-5deg) scale(1)' },
      { transform: 'rotate(6deg) scale(1.2,.88)', offset: .36 },
      { transform: 'rotate(-3deg) scale(.94,1.1)', offset: .7 },
      { transform: 'rotate(-5deg) scale(1)' }
    ], { duration: 760, easing: 'cubic-bezier(.22,1,.36,1)' });
    word.animate([{ opacity: 0, transform: 'translateX(-16px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 430, delay: 180, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    home.animate([{ opacity: 0, transform: 'translateX(-12px) scale(.9)' }, { opacity: 1, transform: 'translateX(0) scale(1)' }], { duration: 380, delay: 480, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
  }
  clearTimeout(animateBrand.timer);
  animateBrand.timer = setTimeout(() => brand.classList.remove('reveal'), 2400);
}

let viewTransitionSequence = 0;

function runViewSplash(id) {
  if (!tabAnimationsEnabled) return Promise.resolve();
  const overlay = $('#view-splash');
  const label = document.querySelector(`.nav-item[data-view="${id}"] em`)?.textContent.trim() || id;
  const word = $('#view-splash-word');
  word.innerHTML = [...label.toUpperCase()].map(letter => `<span>${letter === ' ' ? '&nbsp;' : esc(letter)}</span>`).join('');
  overlay.classList.remove('leaving');
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.querySelectorAll('.view-splash-word span').forEach((letter, index) => {
    letter.animate([
      { opacity: 0, transform: 'translateX(70vw) skewX(-10deg)' },
      { opacity: 1, transform: 'translateX(-10px) skewX(3deg)', offset: .76 },
      { opacity: 1, transform: 'translateX(0) skewX(0)' }
    ], { duration: 760, delay: index * 55, easing: 'cubic-bezier(.18,.78,.22,1)', fill: 'both' });
  });
  return new Promise(resolve => setTimeout(resolve, Math.min(1320, 820 + label.length * 55)));
}

async function showView(id) {
  const sequence = ++viewTransitionSequence;
  $('.sidebar').classList.remove('open');
  await runViewSplash(id);
  if (sequence !== viewTransitionSequence) return;
  $$('.view').forEach(view => view.classList.toggle('active-view', view.id === id));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === id));
  const overlay = $('#view-splash');
  overlay.classList.add('leaving');
  setTimeout(() => {
    if (sequence !== viewTransitionSequence) return;
    overlay.classList.remove('active', 'leaving');
    overlay.setAttribute('aria-hidden', 'true');
  }, 420);
  animateBrand();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('.nav-item').forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));
$$('[data-view-target]').forEach(item => item.addEventListener('click', () => showView(item.dataset.viewTarget)));
$('.mobile-menu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#home-button').addEventListener('click', () => showView('dashboard'));
$('#animated-brand').addEventListener('mouseenter', animateBrand);

function applySidebarState() {
  document.body.classList.toggle('sidebar-compact', sidebarCompact);
  const toggle = $('#sidebar-toggle');
  toggle.setAttribute('aria-expanded', String(!sidebarCompact));
  toggle.setAttribute('aria-label', sidebarCompact ? 'Expand navigation' : 'Collapse navigation');
  toggle.querySelector('span').textContent = sidebarCompact ? '›' : '‹';
}

$('#sidebar-toggle').addEventListener('click', () => {
  sidebarCompact = !sidebarCompact;
  localStorage.setItem('edgelog-sidebar-compact', String(sidebarCompact));
  applySidebarState();
  animateBrand();
});

function applyMotionSetting() {
  $('#tab-animation-toggle').checked = tabAnimationsEnabled;
  document.body.classList.toggle('tab-animations-disabled', !tabAnimationsEnabled);
}

$('#tab-animation-toggle').addEventListener('change', event => {
  tabAnimationsEnabled = event.target.checked;
  localStorage.setItem('edgelog-tab-animations', String(tabAnimationsEnabled));
  applyMotionSetting();
  toast(tabAnimationsEnabled ? 'Tab splash animations enabled' : 'Tab splash animations disabled');
});

function openModal(id) { $(id).classList.add('open'); $(id).setAttribute('aria-hidden', 'false'); }
function closeModal(element) { element.classList.remove('open'); element.setAttribute('aria-hidden', 'true'); }
$$('[data-open-trade]').forEach(button => button.addEventListener('click', openNewTrade));
$$('[data-open-pricing]').forEach(button => button.addEventListener('click', () => openModal('#pricing-modal')));
$$('.modal').forEach(modal => modal.addEventListener('click', event => {
  if (event.target === modal || event.target.classList.contains('modal-close')) closeModal(modal);
}));

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 3000);
}

const tradeForm = $('#trade-form');

function populateSetupTemplates(market) {
  const select = $('#setup-template');
  const templates = setupTemplates.filter(template => template.market === market);
  select.innerHTML = '<option value="">Custom setup</option>' + templates.map(template => `<option value="${esc(template.name)}">${esc(template.name)}</option>`).join('');
}

function applySetupTemplate(name) {
  if (!name) return;
  const market = tradeForm.elements.market.value;
  const template = setupTemplates.find(item => item.market === market && item.name === name);
  if (!template) return;
  tradeForm.elements.setup.value = template.name;
  const group = document.querySelector(`[data-criteria-market="${market}"]`);
  group.querySelectorAll('input').forEach(input => { input.checked = template.criteria.includes(input.value); });
}

function renderFuturesSettings() {
  $('#futures-contract-list').innerHTML = futuresContracts.map(contract => {
    const pointValue = contract.tickValue / contract.tickSize;
    return `<div class="contract-row"><span class="contract-symbol">${esc(contract.symbol)}</span><span><strong>${esc(contract.name)}</strong><small>$${pointValue.toLocaleString()} per point</small></span><span class="tick-size"><small>Tick size</small>${contract.tickSize}</span><span class="tick-value"><small>Tick value</small>$${contract.tickValue}</span><span><small>Point value</small>$${pointValue.toLocaleString()}</span><button class="delete-contract" data-symbol="${esc(contract.symbol)}" aria-label="Delete ${esc(contract.symbol)}">x</button></div>`;
  }).join('');
  if (tradeForm.elements.market.value === 'Futures') $('#market-symbols').innerHTML = futuresContracts.map(contract => `<option value="${esc(contract.symbol)}">${esc(contract.name)}</option>`).join('');
}

function renderTradingSessions() {
  if (!tradingSessions.some(session => session.name === defaultSession) && tradingSessions.length) defaultSession = tradingSessions[0].name;
  $('#trading-session-list').innerHTML = tradingSessions.map(session => `<div class="session-row">
    <span><strong>${esc(session.name)}</strong><small>${session.name === defaultSession ? 'Default session' : `<button class="session-default" data-session="${esc(session.name)}">Make default</button>`}</small></span>
    <span class="session-zone"><small>Time zone</small>${esc(session.timezone.replace('_', ' '))}</span>
    <span class="session-time"><small>Trading hours</small>${esc(session.start)} - ${esc(session.end)}</span>
    <button class="delete-contract delete-session" data-session="${esc(session.name)}" aria-label="Delete ${esc(session.name)}">x</button>
  </div>`).join('');
  const sessionSelect = $('#trade-session');
  sessionSelect.innerHTML = '<option value="">Unspecified</option>' + tradingSessions.map(session => `<option value="${esc(session.name)}" ${session.name === defaultSession ? 'selected' : ''}>${esc(session.name)} (${esc(session.start)}-${esc(session.end)})</option>`).join('');
}

function applyFuturesSymbol() {
  if (tradeForm.elements.market.value !== 'Futures') return;
  const symbol = tradeForm.elements.symbol.value.trim().toUpperCase();
  const contract = futuresContracts.find(item => item.symbol === symbol);
  if (!contract) return;
  const pointValue = contract.tickValue / contract.tickSize;
  tradeForm.elements.multiplier.value = pointValue;
  $('#market-helper').textContent = `${contract.symbol}: $${contract.tickValue} per ${contract.tickSize} tick, or $${pointValue.toLocaleString()} per point. You can still edit the point value.`;
  calculateTrade();
}

function updateForexSizeLabel() {
  if (tradeForm.elements.market.value !== 'Forex') return;
  const mode = Number(tradeForm.elements.forexSizeMode.value);
  $('#size-label').textContent = mode === 1 ? 'Units' : 'Number of lots';
}

function selectMarket(market) {
  tradeForm.elements.market.value = market;
  $$('#trade-form [data-market-choice]').forEach(button => button.classList.toggle('active', button.dataset.marketChoice === market));
  $('#trade-market-title').textContent = ({ Stocks: 'stock', Options: 'options', Futures: 'futures', Forex: 'forex' })[market];
  $$('.market-only').forEach(element => element.classList.toggle('visible', element.classList.contains(`${market.toLowerCase()}-only`)));
  $$('.criteria-group').forEach(element => element.classList.toggle('active', element.dataset.criteriaMarket === market));
  const labels = { Stocks: 'Shares', Options: 'Contracts', Futures: 'Contracts', Forex: 'Units' };
  const helpers = {
    Stocks: 'P&L = price change x shares, less fees.',
    Options: 'P&L = premium change x contracts x 100, less fees.',
    Futures: 'Choose a saved symbol to fill its point value, or enter the point value manually.',
    Forex: 'Choose units or lots. P&L uses price change x converted units x quote conversion.'
  };
  $('#size-label').textContent = labels[market];
  $('#market-helper').textContent = helpers[market];
  $('#market-symbols').innerHTML = market === 'Futures' ? futuresContracts.map(contract => `<option value="${esc(contract.symbol)}">${esc(contract.name)}</option>`).join('') : '';
  populateSetupTemplates(market);
  if (market === 'Forex') updateForexSizeLabel();
  renderTradeRuleChecklist();
  calculateTrade();
}

function resetTradeModalPresentation() {
  $('#pre-preview').classList.remove('visible');
  $('#post-preview').classList.remove('visible');
  $('#pre-preview').removeAttribute('src');
  $('#post-preview').removeAttribute('src');
  $('#trade-modal-eyebrow').textContent = editingTradeId ? 'EDIT JOURNAL ENTRY' : 'NEW JOURNAL ENTRY';
  $('#trade-modal-action').textContent = editingTradeId ? 'Edit' : 'Log';
  $('#trade-submit').textContent = editingTradeId ? 'Update trade' : 'Save trade';
}

function openNewTrade() {
  editingTradeId = null;
  tradeForm.reset();
  $$('.criteria-group input').forEach(input => { input.checked = false; });
  selectMarket('Stocks');
  $('#trade-session').value = defaultSession;
  tradeForm.elements.tradeDateTime.value = toDateTimeLocal();
  tradeForm.elements.status.value = 'Closed';
  resetTradeModalPresentation();
  openModal('#trade-modal');
}

function openTradeEditor(trade) {
  editingTradeId = trade.id;
  tradeForm.reset();
  selectMarket(trade.market);
  const fields = tradeForm.elements;
  fields.symbol.value = trade.symbol || '';
  fields.direction.value = trade.direction || 'Long';
  fields.accountId.value = trade.accountId || tradingAccounts[0]?.id || '';
  fields.tradeDateTime.value = toDateTimeLocal(trade.createdAt || new Date());
  fields.status.value = trade.status || 'Closed';
  fields.session.value = trade.session || '';
  fields.entry.value = trade.entry ?? '';
  fields.exit.value = trade.exit ?? '';
  fields.size.value = trade.size ?? 1;
  fields.fees.value = trade.fees ?? 0;
  fields.capital.value = trade.capital ?? (trade.ret ? Math.abs(trade.result / (trade.ret / 100)).toFixed(2) : '');
  fields.setup.value = trade.setup || '';
  fields.setupTemplate.value = [...fields.setupTemplate.options].some(option => option.value === trade.setup) ? trade.setup : '';
  fields.notes.value = trade.notes || '';
  fields.stopLoss.value = trade.stopLoss ?? '';
  fields.profitTarget.value = trade.profitTarget ?? '';
  fields.plannedRisk.value = trade.plannedRisk ?? '';
  fields.mfe.value = trade.mfe ?? '';
  fields.mae.value = trade.mae ?? '';
  fields.grade.value = trade.grade || '';
  fields.additionalEntries.value = trade.additionalEntries || '';
  fields.partialExits.value = trade.partialExits || '';
  fields.emotion.value = trade.emotion || '';
  fields.confidence.value = trade.confidence || '';
  fields.tags.value = Array.isArray(trade.tags) ? trade.tags.join(', ') : (trade.tags || '');
  fields.mistakes.value = trade.mistakes || '';
  fields.lessons.value = trade.lessons || '';
  if (trade.market === 'Futures') fields.multiplier.value = trade.multiplier ?? 1;
  if (trade.market === 'Forex') {
    fields.forexSizeMode.value = trade.sizeMode || '1';
    fields.conversion.value = trade.conversion ?? 1;
    updateForexSizeLabel();
  }
  $$('.criteria-group input').forEach(input => { input.checked = Array.isArray(trade.criteria) && trade.criteria.includes(input.value); });
  const ruleMap = new Map((trade.ruleResults || []).map(result => [result.ruleId, result.followed]));
  $$('#trade-rule-checklist input[data-rule-id]').forEach(input => { input.checked = ruleMap.has(input.dataset.ruleId) ? ruleMap.get(input.dataset.ruleId) : true; });
  resetTradeModalPresentation();
  if (trade.preImage) { $('#pre-preview').src = trade.preImage; $('#pre-preview').classList.add('visible'); }
  if (trade.postImage) { $('#post-preview').src = trade.postImage; $('#post-preview').classList.add('visible'); }
  calculateTrade();
  openModal('#trade-modal');
}

$$('#trade-form [data-market-choice]').forEach(button => button.addEventListener('click', () => selectMarket(button.dataset.marketChoice)));
$('#setup-template').addEventListener('change', event => applySetupTemplate(event.target.value));
tradeForm.elements.symbol.addEventListener('change', applyFuturesSymbol);
tradeForm.elements.forexSizeMode.addEventListener('change', updateForexSizeLabel);

function calculateTrade() {
  const fields = tradeForm.elements;
  const market = fields.market.value;
  const entry = Number(fields.entry.value);
  const exit = Number(fields.exit.value);
  const size = Number(fields.size.value);
  const fees = Number(fields.fees.value) || 0;
  const capital = Number(fields.capital.value);
  const side = fields.direction.value === 'Long' ? 1 : -1;
  let multiplier = 1;
  if (market === 'Options') multiplier = 100;
  if (market === 'Futures') multiplier = Number(fields.multiplier.value) || 0;
  if (market === 'Forex') multiplier = (Number(fields.conversion.value) || 0) * (Number(fields.forexSizeMode.value) || 1);
  const isOpen = fields.status.value === 'Open';
  const ready = !isOpen && entry > 0 && exit > 0 && size > 0;
  const result = ready ? ((exit - entry) * side * size * multiplier) - fees : 0;
  const ret = ready && capital > 0 ? result / capital * 100 : 0;
  $('#calculated-result').textContent = money(result);
  $('#calculated-return').textContent = `${ret >= 0 ? '+' : ''}${ret.toFixed(2)}%`;
  $('#calculated-status').textContent = isOpen ? 'Open position' : !ready ? 'Waiting for prices' : result > 0 ? 'Winning trade' : result < 0 ? 'Losing trade' : 'Breakeven';
  ['#calculated-result', '#calculated-return'].forEach(selector => {
    $(selector).classList.toggle('positive-value', ready && result >= 0);
    $(selector).classList.toggle('negative-value', ready && result < 0);
  });
  return { result, ret };
}

tradeForm.addEventListener('input', calculateTrade);
tradeForm.addEventListener('change', calculateTrade);

function previewFile(input, imageSelector) {
  const image = $(imageSelector);
  if (!input.files[0]) { image.classList.remove('visible'); image.removeAttribute('src'); return; }
  image.src = URL.createObjectURL(input.files[0]);
  image.classList.add('visible');
}

tradeForm.elements.preScreenshot.addEventListener('change', event => previewFile(event.target, '#pre-preview'));
tradeForm.elements.postScreenshot.addEventListener('change', event => previewFile(event.target, '#post-preview'));

function compressImage(file) {
  if (!file) return Promise.resolve('');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSide = 1200;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.66));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

tradeForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submitButton = tradeForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Saving trade...';
  try {
    const existingTrade = editingTradeId ? trades.find(trade => trade.id === editingTradeId) : null;
    const form = new FormData(event.target);
    const market = form.get('market');
    const calculation = calculateTrade();
    const criteria = [...document.querySelectorAll(`[data-criteria-market="${market}"] input:checked`)].map(input => input.value);
    const ruleResults = [...document.querySelectorAll('#trade-rule-checklist input[data-rule-id]')].map(input => ({ ruleId: input.dataset.ruleId, followed: input.checked }));
    const [newPreImage, newPostImage] = await Promise.all([
      compressImage(tradeForm.elements.preScreenshot.files[0]),
      compressImage(tradeForm.elements.postScreenshot.files[0])
    ]);
    const preImage = newPreImage || existingTrade?.preImage || '';
    const postImage = newPostImage || existingTrade?.postImage || '';
    const tradeTimestamp = new Date(form.get('tradeDateTime'));
    const plannedRisk = Number(form.get('plannedRisk')) || 0;
    const trade = {
      id: existingTrade?.id || `trade-${Date.now()}`, market, symbol: form.get('symbol').toUpperCase(), direction: form.get('direction'),
      session: form.get('session'), accountId: form.get('accountId'), status: form.get('status'),
      setup: form.get('setup'), entry: Number(form.get('entry')), exit: Number(form.get('exit')), size: Number(form.get('size')),
      sizeMode: market === 'Forex' ? form.get('forexSizeMode') : '', result: Number(calculation.result.toFixed(2)), ret: Number(calculation.ret.toFixed(2)),
      multiplier: market === 'Futures' ? Number(form.get('multiplier')) : null,
      conversion: market === 'Forex' ? Number(form.get('conversion')) : null,
      fees: Number(form.get('fees')) || 0,
      capital: Number(form.get('capital')),
      stopLoss: Number(form.get('stopLoss')) || null, profitTarget: Number(form.get('profitTarget')) || null,
      plannedRisk, actualR: plannedRisk > 0 && form.get('status') !== 'Open' ? Number((calculation.result / plannedRisk).toFixed(2)) : null,
      mfe: Number(form.get('mfe')) || null, mae: Number(form.get('mae')) || null, grade: form.get('grade'),
      additionalEntries: form.get('additionalEntries').trim(), partialExits: form.get('partialExits').trim(),
      emotion: form.get('emotion'), confidence: Number(form.get('confidence')) || null,
      tags: form.get('tags').split(',').map(tag => tag.trim()).filter(Boolean), mistakes: form.get('mistakes').trim(), lessons: form.get('lessons').trim(),
      criteria, ruleResults, notes: form.get('notes'), preImage, postImage,
      date: tradeTimestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      createdAt: tradeTimestamp.toISOString(), updatedAt: new Date().toISOString()
    };
    if (existingTrade) trades[trades.findIndex(item => item.id === existingTrade.id)] = trade;
    else trades.unshift(trade);
    let imagesSaved = true;
    try { localStorage.setItem('edgelog-trades', JSON.stringify(trades)); }
    catch {
      imagesSaved = false;
      trade.preImage = '';
      trade.postImage = '';
      localStorage.setItem('edgelog-trades', JSON.stringify(trades));
    }
    if (form.get('saveTemplate')) {
      const existing = setupTemplates.find(template => template.market === market && template.name.toLowerCase() === trade.setup.toLowerCase());
      if (existing) existing.criteria = criteria;
      else setupTemplates.push({ market, name: trade.setup, criteria });
      localStorage.setItem('edgelog-setup-templates', JSON.stringify(setupTemplates));
    }
    render();
    closeModal($('#trade-modal'));
    event.target.reset();
    $('#pre-preview').classList.remove('visible');
    $('#post-preview').classList.remove('visible');
    selectMarket('Stocks');
    $('#trade-session').value = defaultSession;
    const wasEditing = Boolean(existingTrade);
    editingTradeId = null;
    toast(imagesSaved ? (wasEditing ? 'Trade updated on this device' : 'Trade saved privately to this device') : 'Trade saved locally, but the images exceeded device storage');
  } catch {
    toast('The trade could not be saved. Check the image files and try again.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingTradeId ? 'Update trade' : 'Save trade';
  }
});

function filterTrades() {
  const query = $('#trade-search').value.toLowerCase();
  const market = $('#market-filter').value;
  renderRows($('#journal-trades'), trades.filter(trade => (market === 'all' || trade.market === market) && (trade.symbol.toLowerCase().includes(query) || trade.setup.toLowerCase().includes(query))), true);
  updateBulkActions();
}
$('#trade-search').addEventListener('input', filterTrades);
$('#market-filter').addEventListener('change', filterTrades);

function updateBulkActions() {
  const visibleBoxes = [...document.querySelectorAll('#journal-trades .trade-select')];
  $('#selected-trade-count').textContent = `${selectedTradeIds.size} selected`;
  $('#delete-selected-trades').disabled = selectedTradeIds.size === 0;
  $('#select-all-trades').checked = visibleBoxes.length > 0 && visibleBoxes.every(box => box.checked);
  $('#select-all-trades').indeterminate = visibleBoxes.some(box => box.checked) && !visibleBoxes.every(box => box.checked);
  visibleBoxes.forEach(box => box.closest('tr').classList.toggle('selected-row', box.checked));
}

function deleteTrades(ids) {
  trades = trades.filter(trade => !ids.has(trade.id));
  ids.forEach(id => selectedTradeIds.delete(id));
  localStorage.setItem('edgelog-trades', JSON.stringify(trades));
  render();
  updateBulkActions();
}

$('#select-all-trades').addEventListener('change', event => {
  document.querySelectorAll('#journal-trades .trade-select').forEach(box => {
    box.checked = event.target.checked;
    if (box.checked) selectedTradeIds.add(box.dataset.tradeId);
    else selectedTradeIds.delete(box.dataset.tradeId);
  });
  updateBulkActions();
});

$('#delete-selected-trades').addEventListener('click', () => {
  if (!selectedTradeIds.size) return;
  const count = selectedTradeIds.size;
  const confirmed = window.confirm(`BETA WARNING: Permanently delete ${count} selected trade${count === 1 ? '' : 's'} from this device? This cannot be reverted. Export a backup first if you may need the data later.`);
  if (!confirmed) return;
  deleteTrades(new Set(selectedTradeIds));
  toast(`${count} trade${count === 1 ? '' : 's'} permanently deleted`);
});

$('#journal-trades').addEventListener('change', event => {
  const checkbox = event.target.closest('.trade-select');
  if (!checkbox) return;
  if (checkbox.checked) selectedTradeIds.add(checkbox.dataset.tradeId);
  else selectedTradeIds.delete(checkbox.dataset.tradeId);
  updateBulkActions();
});

$('#journal-trades').addEventListener('click', event => {
  const screenshotButton = event.target.closest('.trade-shot');
  if (screenshotButton) {
    const trade = trades.find(item => item.id === screenshotButton.dataset.tradeId);
    if (!trade) return;
    const isPre = screenshotButton.dataset.shot === 'pre';
    $('#screenshot-full').src = isPre ? trade.preImage : trade.postImage;
    $('#screenshot-modal-label').textContent = isPre ? 'PRE-TRADE CHART' : 'POST-TRADE CHART';
    openModal('#screenshot-modal');
    return;
  }
  const editButton = event.target.closest('.trade-edit');
  if (editButton) {
    const trade = trades.find(item => item.id === editButton.dataset.tradeId);
    if (trade) openTradeEditor(trade);
    return;
  }
  const deleteButton = event.target.closest('.trade-delete');
  if (deleteButton) {
    const trade = trades.find(item => item.id === deleteButton.dataset.tradeId);
    if (!trade) return;
    const confirmed = window.confirm(`BETA WARNING: Permanently delete ${trade.symbol} from the journal? This cannot be reverted.`);
    if (!confirmed) return;
    deleteTrades(new Set([trade.id]));
    toast(`${trade.symbol} permanently deleted`);
  }
});

$('#recent-trades').addEventListener('click', event => {
  const editButton = event.target.closest('.trade-edit');
  if (editButton) {
    const trade = trades.find(item => item.id === editButton.dataset.tradeId);
    if (trade) openTradeEditor(trade);
    return;
  }
  const deleteButton = event.target.closest('.trade-delete');
  if (!deleteButton) return;
  const trade = trades.find(item => item.id === deleteButton.dataset.tradeId);
  if (!trade) return;
  const confirmed = window.confirm(`BETA WARNING: Permanently delete ${trade.symbol} from this device? This cannot be reverted.`);
  if (!confirmed) return;
  deleteTrades(new Set([trade.id]));
  toast(`${trade.symbol} permanently deleted`);
});

const futuresForm = $('#futures-setting-form');
function previewPointValue() {
  const tickSize = Number(futuresForm.elements.tickSize.value);
  const tickValue = Number(futuresForm.elements.tickValue.value);
  $('#point-value-preview').textContent = tickSize > 0 && tickValue > 0 ? `$${(tickValue / tickSize).toLocaleString()}` : '$0.00';
}
futuresForm.addEventListener('input', previewPointValue);
futuresForm.addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(futuresForm);
  const contract = { symbol: form.get('symbol').trim().toUpperCase(), name: form.get('name').trim(), tickSize: Number(form.get('tickSize')), tickValue: Number(form.get('tickValue')) };
  const existing = futuresContracts.findIndex(item => item.symbol === contract.symbol);
  if (existing >= 0) futuresContracts[existing] = contract;
  else futuresContracts.push(contract);
  localStorage.setItem('edgelog-futures-contracts', JSON.stringify(futuresContracts));
  renderFuturesSettings();
  futuresForm.reset();
  previewPointValue();
  toast(`${contract.symbol} saved to your futures list`);
});

$('#futures-contract-list').addEventListener('click', event => {
  const button = event.target.closest('.delete-contract');
  if (!button) return;
  futuresContracts = futuresContracts.filter(contract => contract.symbol !== button.dataset.symbol);
  localStorage.setItem('edgelog-futures-contracts', JSON.stringify(futuresContracts));
  renderFuturesSettings();
  toast(`${button.dataset.symbol} removed`);
});

$('#add-rule-button').addEventListener('click', () => openModal('#rule-modal'));
$('#rule-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.target);
  const rule = { id: `rule-${Date.now()}`, category: form.get('category'), market: form.get('market'), name: form.get('name').trim(), description: form.get('description').trim(), severity: form.get('severity'), reason: form.get('reason').trim(), active: true };
  tradingRules.push(rule);
  localStorage.setItem('edgelog-trading-rules', JSON.stringify(tradingRules));
  event.target.reset();
  closeModal($('#rule-modal'));
  renderRules();
  toast('Rule added to your trade checklist');
});

$$('.rule-filter').forEach(button => button.addEventListener('click', () => {
  currentRuleFilter = button.dataset.ruleFilter;
  $$('.rule-filter').forEach(item => item.classList.toggle('active', item === button));
  renderRules();
}));

$('#rules-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  const card = event.target.closest('[data-rule-id]');
  if (!button || !card) return;
  const index = tradingRules.findIndex(rule => rule.id === card.dataset.ruleId);
  if (index < 0) return;
  if (button.dataset.action === 'toggle') tradingRules[index].active = !tradingRules[index].active;
  if (button.dataset.action === 'delete') {
    const removedRuleName = tradingRules[index].name;
    const confirmed = window.confirm(`Remove the rule "${removedRuleName}"? It will disappear from future trade checklists. Historical rule checks will remain in saved trades.`);
    if (!confirmed) return;
    tradingRules.splice(index, 1);
    toast(`"${removedRuleName}" removed from future checklists`);
  }
  localStorage.setItem('edgelog-trading-rules', JSON.stringify(tradingRules));
  renderRules();
});

const tradingSessionForm = $('#trading-session-form');
tradingSessionForm.addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(tradingSessionForm);
  const session = { name: form.get('name').trim(), timezone: form.get('timezone'), start: form.get('start'), end: form.get('end') };
  const existing = tradingSessions.findIndex(item => item.name.toLowerCase() === session.name.toLowerCase());
  if (existing >= 0) tradingSessions[existing] = session;
  else tradingSessions.push(session);
  localStorage.setItem('edgelog-trading-sessions', JSON.stringify(tradingSessions));
  renderTradingSessions();
  tradingSessionForm.reset();
  toast(`${session.name} trading session saved`);
});

$('#trading-session-list').addEventListener('click', event => {
  const defaultButton = event.target.closest('.session-default');
  if (defaultButton) {
    defaultSession = defaultButton.dataset.session;
    localStorage.setItem('edgelog-default-session', defaultSession);
    renderTradingSessions();
    toast(`${defaultSession} is now your default session`);
    return;
  }
  const deleteButton = event.target.closest('.delete-session');
  if (!deleteButton) return;
  tradingSessions = tradingSessions.filter(session => session.name !== deleteButton.dataset.session);
  if (defaultSession === deleteButton.dataset.session) defaultSession = tradingSessions[0]?.name || '';
  localStorage.setItem('edgelog-trading-sessions', JSON.stringify(tradingSessions));
  localStorage.setItem('edgelog-default-session', defaultSession);
  renderTradingSessions();
  toast(`${deleteButton.dataset.session} session removed`);
});

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function derivePassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: base64ToBytes(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
}

function updateSecurityUI() {
  const enabled = Boolean(securityCredentials);
  $('#security-status-dot').classList.toggle('enabled', enabled);
  $('#security-status-text').textContent = enabled ? 'Password protection enabled' : 'No password set';
  $('#current-password-label').hidden = !enabled;
  $('#security-form').elements.currentPassword.required = enabled;
  $('#security-form').querySelector('[type="submit"]').textContent = enabled ? 'Change password' : 'Set password';
  $('#lock-app').disabled = !enabled;
}

function showAppLock() {
  if (!securityCredentials) return;
  sessionStorage.removeItem('edgelog-unlocked');
  $('#consent-overlay').classList.remove('visible');
  $('#app-lock').classList.add('visible');
  $('#app-lock').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#unlock-form').elements.password.focus(), 50);
}

function hideAppLock() {
  $('#app-lock').classList.remove('visible');
  $('#app-lock').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  $('#unlock-form').reset();
  $('#lock-error').textContent = '';
  maybeShowConsent();
}

$('#security-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.target);
  const currentPassword = form.get('currentPassword');
  const newPassword = form.get('newPassword');
  const confirmation = form.get('confirmPassword');
  const submit = event.target.querySelector('[type="submit"]');
  if (newPassword !== confirmation) { toast('The new passwords do not match'); return; }
  if (newPassword.length < 8) { toast('Use at least 8 characters'); return; }
  submit.disabled = true;
  submit.textContent = 'Securing...';
  try {
    if (securityCredentials) {
      const currentHash = await derivePassword(currentPassword, securityCredentials.salt);
      if (currentHash !== securityCredentials.hash) { toast('Current password is incorrect'); return; }
    }
    const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await derivePassword(newPassword, salt);
    securityCredentials = { salt, hash };
    localStorage.setItem('edgelog-security', JSON.stringify(securityCredentials));
    sessionStorage.setItem('edgelog-unlocked', 'true');
    event.target.reset();
    updateSecurityUI();
    toast('Password protection is now enabled');
  } catch {
    toast('Password protection is unavailable in this browser');
  } finally {
    submit.disabled = false;
    updateSecurityUI();
  }
});

$('#lock-app').addEventListener('click', showAppLock);
$('#unlock-form').addEventListener('submit', async event => {
  event.preventDefault();
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Checking...';
  try {
    const enteredHash = await derivePassword(event.target.elements.password.value, securityCredentials.salt);
    if (enteredHash === securityCredentials.hash) {
      sessionStorage.setItem('edgelog-unlocked', 'true');
      hideAppLock();
    } else {
      $('#lock-error').textContent = 'That password is not correct.';
      event.target.elements.password.select();
    }
  } catch {
    $('#lock-error').textContent = 'Unable to verify the password in this browser.';
  } finally {
    submit.disabled = false;
    submit.textContent = 'Unlock eLOG';
  }
});

function populateConsentForm() {
  const form = $('#consent-form');
  ['analytics', 'diagnostics', 'tradeInsights', 'marketing'].forEach(key => {
    form.elements[key].checked = Boolean(privacyConsent?.[key]);
  });
}

function renderPrivacySummary() {
  const summary = $('#privacy-summary');
  if (!privacyConsent) {
    summary.innerHTML = '<span class="privacy-chip">Choices not saved yet</span>';
    return;
  }
  const labels = { analytics: 'Usage analytics', diagnostics: 'Diagnostics', tradeInsights: 'Trading insights', marketing: 'Product updates' };
  summary.innerHTML = '<span class="privacy-chip on">Essential: on</span>' + Object.entries(labels).map(([key, label]) => `<span class="privacy-chip ${privacyConsent[key] ? 'on' : ''}">${label}: ${privacyConsent[key] ? 'on' : 'off'}</span>`).join('');
}

function showConsent() {
  populateConsentForm();
  $('#consent-overlay').classList.add('visible');
  $('#consent-overlay').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function hideConsent() {
  $('#consent-overlay').classList.remove('visible');
  $('#consent-overlay').setAttribute('aria-hidden', 'true');
  if (!$('#app-lock').classList.contains('visible')) document.body.style.overflow = '';
  setTimeout(animateBrand, 280);
  if (!localStorage.getItem('edgelog-mk1-guide-seen')) setTimeout(openGuide, 520);
}

function maybeShowConsent() {
  const needsChoice = !privacyConsent || privacyConsent.version !== CONSENT_VERSION;
  if (needsChoice && !$('#app-lock').classList.contains('visible')) showConsent();
}

function saveConsentChoices() {
  const form = $('#consent-form');
  privacyConsent = {
    version: CONSENT_VERSION,
    savedAt: new Date().toISOString(),
    essential: true,
    analytics: form.elements.analytics.checked,
    diagnostics: form.elements.diagnostics.checked,
    tradeInsights: form.elements.tradeInsights.checked,
    marketing: form.elements.marketing.checked
  };
  localStorage.setItem('edgelog-consent', JSON.stringify(privacyConsent));
  renderPrivacySummary();
  hideConsent();
  toast('Your privacy choices were saved');
}

$('#consent-form').addEventListener('submit', event => {
  event.preventDefault();
  saveConsentChoices();
});

$('#reject-optional').addEventListener('click', () => {
  $('#consent-form').querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = false; });
  saveConsentChoices();
});

$('#accept-all').addEventListener('click', () => {
  $('#consent-form').querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = true; });
  saveConsentChoices();
});

$('#manage-privacy').addEventListener('click', showConsent);

const BACKUP_KEY = 'edgelog-device-backups';

function getDeviceBackups() {
  const backups = readStore(BACKUP_KEY, []);
  return Array.isArray(backups) ? backups : [];
}

function currentWorkspaceItems() {
  return Object.fromEntries(Object.keys(localStorage)
    .filter(key => key.startsWith('edgelog-') && key !== BACKUP_KEY)
    .map(key => [key, localStorage.getItem(key)]));
}

function renderDeviceBackups() {
  const backups = getDeviceBackups();
  const list = $('#backup-list');
  if (!backups.length) {
    list.innerHTML = '<div class="backup-empty">No restore points yet. Create one before making major changes.</div>';
    return;
  }
  list.innerHTML = backups.map(backup => {
    let tradeCount = 0;
    try { tradeCount = JSON.parse(backup.items['edgelog-trades'] || '[]').length; } catch { tradeCount = 0; }
    const created = new Date(backup.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    return `<div class="backup-row" data-backup-id="${esc(backup.id)}"><span class="backup-icon">↻</span><span><strong>${esc(backup.name)}</strong><small>${esc(created)} · ${tradeCount} trade${tradeCount === 1 ? '' : 's'}</small></span><button class="secondary-button restore-backup" type="button">Restore</button><button class="backup-delete" type="button" aria-label="Delete ${esc(backup.name)}">Delete</button></div>`;
  }).join('');
}

$('#create-backup').addEventListener('click', () => {
  const suggestedName = `Backup ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  const name = window.prompt('Name this on-device restore point:', suggestedName)?.trim();
  if (!name) return;
  const backups = getDeviceBackups();
  backups.unshift({ id: `backup-${Date.now()}`, name: name.slice(0, 60), createdAt: new Date().toISOString(), items: currentWorkspaceItems() });
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(0, 5)));
    renderDeviceBackups();
    toast('On-device backup created');
  } catch {
    toast('This browser is out of backup space. Download an export instead.');
  }
});

$('#backup-list').addEventListener('click', event => {
  const row = event.target.closest('[data-backup-id]');
  if (!row) return;
  const backups = getDeviceBackups();
  const backup = backups.find(item => item.id === row.dataset.backupId);
  if (!backup) return;
  if (event.target.closest('.restore-backup')) {
    const confirmed = window.confirm(`Restore "${backup.name}"? This will replace the current eLOG workspace. Create or download a backup first if you may need the current version.`);
    if (!confirmed) return;
    Object.keys(localStorage).filter(key => key.startsWith('edgelog-') && key !== BACKUP_KEY).forEach(key => localStorage.removeItem(key));
    Object.entries(backup.items).forEach(([key, value]) => localStorage.setItem(key, value));
    sessionStorage.removeItem('edgelog-unlocked');
    window.location.reload();
    return;
  }
  if (event.target.closest('.backup-delete')) {
    const confirmed = window.confirm(`Delete the restore point "${backup.name}"? This cannot be undone.`);
    if (!confirmed) return;
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.filter(item => item.id !== backup.id)));
    renderDeviceBackups();
    toast('Backup deleted');
  }
});

function exportWorkspace() {
  const exportPackage = {
    exportedAt: new Date().toISOString(),
    product: 'eLOG',
    version: APP_VERSION,
    trades,
    setupTemplates,
    futuresContracts,
    tradingSessions,
    tradingRules,
    userProfile,
    tradingAccounts,
    cashAdjustments,
    defaultSession,
    privacyConsent
  };
  const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `elog-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  toast('Your eLOG data export is ready');
}

$('#export-data').addEventListener('click', exportWorkspace);
$('#export-device-data').addEventListener('click', exportWorkspace);
$('#export-backup-copy').addEventListener('click', exportWorkspace);

$('#import-workspace').addEventListener('change', event => {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.trades)) throw new Error('Missing trades');
      if (!window.confirm(`Import this eLOG data copy with ${data.trades.length} trades? It will replace the current workspace. Create an on-device backup first if needed.`)) return;
      const mappings = {
        'edgelog-trades': data.trades, 'edgelog-setup-templates': data.setupTemplates || defaultTemplates,
        'edgelog-futures-contracts': data.futuresContracts || defaultFutures, 'edgelog-trading-sessions': data.tradingSessions || defaultSessions,
        'edgelog-trading-rules': data.tradingRules || defaultRules, 'edgelog-profile': data.userProfile || defaultProfile,
        'edgelog-accounts': data.tradingAccounts || defaultAccounts, 'edgelog-cash-adjustments': data.cashAdjustments || [],
        'edgelog-consent': data.privacyConsent || privacyConsent
      };
      Object.entries(mappings).forEach(([key, value]) => { if (value != null) localStorage.setItem(key, JSON.stringify(value)); });
      if (data.defaultSession) localStorage.setItem('edgelog-default-session', data.defaultSession);
      window.location.reload();
    } catch { toast('That file is not a valid eLOG data copy'); }
  };
  reader.readAsText(file);
});

$('#delete-data').addEventListener('click', () => {
  const confirmed = window.confirm('Delete all eLOG data from this device, including trades, screenshots, settings, on-device backups, consent, and the local password? This cannot be undone.');
  if (!confirmed) return;
  Object.keys(localStorage).filter(key => key.startsWith('edgelog-')).forEach(key => localStorage.removeItem(key));
  sessionStorage.removeItem('edgelog-unlocked');
  window.location.reload();
});

const feedbackForm = $('#feedback-form');
const feedbackMessage = feedbackForm.elements.message;
const feedbackIsOnline = location.protocol === 'https:' || location.protocol === 'http:';
if (feedbackIsOnline) {
  $('#feedback-delivery-dot').classList.add('online');
  $('#feedback-delivery-text').textContent = 'Online beta: feedback will be sent securely to the eLOG feedback endpoint.';
}

function queueFeedback(payload) {
  const outbox = readStore('edgelog-feedback-outbox', []);
  outbox.push(payload);
  localStorage.setItem('edgelog-feedback-outbox', JSON.stringify(outbox));
}

async function deliverFeedback(payload) {
  if (!feedbackIsOnline) {
    queueFeedback(payload);
    return 'queued';
  }
  try {
    const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error('Feedback endpoint unavailable');
    return 'sent';
  } catch {
    queueFeedback(payload);
    return 'queued';
  }
}

$('#feedback-button').addEventListener('click', () => openModal('#feedback-modal'));
feedbackMessage.addEventListener('input', () => { $('#feedback-count').textContent = feedbackMessage.value.length; });
feedbackForm.addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(feedbackForm);
  const submit = feedbackForm.querySelector('[type="submit"]');
  const payload = {
    id: `feedback-${Date.now()}`,
    createdAt: new Date().toISOString(),
    category: form.get('category'),
    rating: Number(form.get('rating')),
    message: form.get('message').trim(),
    replyEmail: form.get('email').trim() || null,
    diagnostics: form.get('shareDiagnostics') ? {
      appVersion: APP_VERSION,
      currentView: $('.active-view')?.id || 'unknown',
      browser: navigator.userAgent,
      diagnosticsConsent: Boolean(privacyConsent?.diagnostics)
    } : null
  };
  submit.disabled = true;
  submit.textContent = 'Sending...';
  const status = await deliverFeedback(payload);
  submit.disabled = false;
  submit.textContent = 'Send beta feedback';
  feedbackForm.reset();
  $('#feedback-count').textContent = '0';
  closeModal($('#feedback-modal'));
  toast(status === 'sent' ? 'Thank you - your beta feedback was sent' : 'Feedback saved to this device and queued for the online beta');
});

function openGuide() {
  openModal('#guide-modal');
}

const legalPages = {
  privacy: { title: 'Privacy policy', body: '<p>Prototype MK1 stores journal information in this browser on this device. Optional sharing choices are recorded locally. Raw trades, notes, screenshots, balances, and rules are not sent to the owner by this local preview.</p><h3>Your choices</h3><p>You can review consent, export data, create backups, import a copy, or erase local information from Settings.</p>' },
  terms: { title: 'Terms of use', body: '<p>eLOG Prototype MK1 is provided for evaluation without warranties. Users are responsible for the accuracy of journal entries, protecting their device, and maintaining downloadable backups.</p><p>Paid plans shown in MK1 are previews only and do not create a paid subscription.</p>' },
  risk: { title: 'Trading risk disclaimer', body: '<p>eLOG is a journaling and analytics tool—not a broker, investment adviser, signal provider, or guarantee of results. Stocks, options, futures, and forex can produce substantial losses, including losses beyond deposited capital in some products.</p><p>Past performance and journal analytics do not predict future results.</p>' },
  deletion: { title: 'Data deletion instructions', body: '<p>Open Settings → Privacy Center → Delete local data to erase eLOG information, backups, settings, consent, and the local password from this browser.</p><p>This action cannot be reversed unless you first download a data copy. Clearing browser storage can also remove the workspace.</p>' }
};

$$('[data-legal]').forEach(button => button.addEventListener('click', () => {
  const page = legalPages[button.dataset.legal];
  $('#legal-title').textContent = page.title; $('#legal-content').innerHTML = page.body; openModal('#legal-modal');
}));

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const modal = document.querySelector('.modal.open');
  if (modal) closeModal(modal);
});

function closeGuide() {
  localStorage.setItem('edgelog-mk1-guide-seen', 'true');
  closeModal($('#guide-modal'));
}

$('#help-button').addEventListener('click', openGuide);
$('#view-tour').addEventListener('click', openGuide);
$('#close-guide').addEventListener('click', closeGuide);
$('#restore-demo').addEventListener('click', () => {
  const confirmed = window.confirm('Replace the current trade journal with the six MK1 demo trades? Your settings and privacy choices will stay unchanged.');
  if (!confirmed) return;
  trades = starterTrades.map(trade => ({ ...trade }));
  localStorage.setItem('edgelog-trades', JSON.stringify(trades));
  render();
  toast('MK1 demo trades restored');
});

$$('.choose-plan').forEach(button => button.addEventListener('click', () => {
  closeModal($('#pricing-modal'));
  toast(button.dataset.plan === 'Beta' ? 'Beta is active with unlimited trade entries' : `${button.dataset.plan} is a Stage 2 plan preview`);
}));
$('#review-button').addEventListener('click', () => toast('Full AI reviews are included in the Pro plan'));
$('#new-playbook').addEventListener('click', () => toast('Create a reusable setup from the trade log'));
$('#add-setup').addEventListener('click', () => { openModal('#trade-modal'); toast('Name the setup and save its checklist'); });

renderFuturesSettings();
renderTradingSessions();
renderAccountSettings();
renderCashActivity();
$('#cash-adjustment-form').elements.date.valueAsDate = new Date();
updateSecurityUI();
renderPrivacySummary();
renderDeviceBackups();
applySidebarState();
applyMotionSetting();
updateCustomRangeVisibility();
selectMarket('Stocks');
render();
if (securityCredentials && sessionStorage.getItem('edgelog-unlocked') !== 'true') showAppLock();
else {
  maybeShowConsent();
  if (privacyConsent?.version === CONSENT_VERSION) setTimeout(animateBrand, 500);
  if (privacyConsent?.version === CONSENT_VERSION && !localStorage.getItem('edgelog-mk1-guide-seen')) setTimeout(openGuide, 650);
}
