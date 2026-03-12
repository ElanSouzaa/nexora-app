/**
 * Nexora — Supabase Data Layer
 * Módulo compartilhado para todas as páginas do dashboard.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://xdxcczywfincjcbvbecb.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkeGNjenl3ZmluY2pjYnZiZWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjA4MTAsImV4cCI6MjA4ODczNjgxMH0.Jhg9yNbMuWtzQ9GPaoJ6KL_nxzht1FLWEHpfDr-J3sE';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─────────────────────────── AUTH ─────────────────────────── */

export async function requireAuth(redirectTo = '../auth.html?mode=login') {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = redirectTo; return null; }
  return session;
}

export async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function signOut() {
  await sb.auth.signOut();
  window.location.href = '../auth.html?mode=login';
}

/* ─────────────────────────── PROFILE ─────────────────────────── */

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

export async function updateProfile(fields) {
  const user = await getUser();
  if (!user) return;
  const { data, error } = await sb.from('profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select().single();
  return { data, error };
}

/* ─────────────────────────── ACCOUNTS ─────────────────────────── */

export async function getAccounts() {
  const { data } = await sb.from('accounts').select('*').eq('ativo', true).order('created_at');
  return data || [];
}

export async function createAccount(fields) {
  const user = await getUser();
  const { data, error } = await sb.from('accounts').insert({ ...fields, user_id: user.id }).select().single();
  return { data, error };
}

export async function updateAccount(id, fields) {
  const { data, error } = await sb.from('accounts')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  return { data, error };
}

export async function deleteAccount(id) {
  const { error } = await sb.from('accounts').update({ ativo: false }).eq('id', id);
  return { error };
}

/* ─────────────────────────── TRANSACTIONS ─────────────────────────── */

export async function getTransactions(filters = {}) {
  let q = sb.from('transactions').select('*, accounts(nome,banco)');
  if (filters.tipo)       q = q.eq('tipo', filters.tipo);
  if (filters.categoria)  q = q.eq('categoria', filters.categoria);
  if (filters.account_id) q = q.eq('account_id', filters.account_id);
  if (filters.from)       q = q.gte('data_compra', filters.from);
  if (filters.to)         q = q.lte('data_compra', filters.to);
  q = q.order('data_compra', { ascending: false }).limit(filters.limit || 500);
  const { data } = await q;
  return data || [];
}

export async function createTransaction(fields) {
  const user = await getUser();
  const { data, error } = await sb.from('transactions').insert({ ...fields, user_id: user.id }).select().single();
  if (!error && fields.account_id) await recalcAccountBalance(fields.account_id);
  return { data, error };
}

export async function updateTransaction(id, fields) {
  const old = await sb.from('transactions').select('account_id').eq('id', id).single();
  const { data, error } = await sb.from('transactions')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (!error) {
    if (old.data?.account_id) await recalcAccountBalance(old.data.account_id);
    if (fields.account_id && fields.account_id !== old.data?.account_id) await recalcAccountBalance(fields.account_id);
  }
  return { data, error };
}

export async function deleteTransaction(id) {
  const old = await sb.from('transactions').select('account_id').eq('id', id).single();
  const { error } = await sb.from('transactions').delete().eq('id', id);
  if (!error && old.data?.account_id) await recalcAccountBalance(old.data.account_id);
  return { error };
}

async function recalcAccountBalance(account_id) {
  const { data } = await sb.from('transactions').select('valor, tipo').eq('account_id', account_id);
  if (!data) return;
  const saldo = data.reduce((acc, t) => t.tipo === 'entrada' ? acc + +t.valor : acc - +t.valor, 0);
  await sb.from('accounts').update({ saldo, updated_at: new Date().toISOString() }).eq('id', account_id);
}

/* ─────────────────────────── CARDS ─────────────────────────── */

export async function getCards() {
  const { data } = await sb.from('cards').select('*, accounts(nome)').eq('ativo', true).order('created_at');
  return data || [];
}

export async function createCard(fields) {
  const user = await getUser();
  const { data, error } = await sb.from('cards').insert({ ...fields, user_id: user.id }).select().single();
  return { data, error };
}

export async function updateCard(id, fields) {
  const { data, error } = await sb.from('cards')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  return { data, error };
}

export async function deleteCard(id) {
  const { error } = await sb.from('cards').update({ ativo: false }).eq('id', id);
  return { error };
}

/* ─────────────────────────── GOALS ─────────────────────────── */

export async function getGoals() {
  const { data } = await sb.from('goals').select('*').order('created_at');
  return data || [];
}

export async function createGoal(fields) {
  const user = await getUser();
  const { data, error } = await sb.from('goals').insert({ ...fields, user_id: user.id }).select().single();
  return { data, error };
}

export async function updateGoal(id, fields) {
  const { data, error } = await sb.from('goals')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  return { data, error };
}

export async function deleteGoal(id) {
  const { error } = await sb.from('goals').delete().eq('id', id);
  return { error };
}

export async function addGoalDeposit(goal_id, valor, notas = '') {
  const user = await getUser();
  const { error: de } = await sb.from('goal_deposits').insert({ goal_id, user_id: user.id, valor, notas });
  if (de) return { error: de };
  const { data: goal } = await sb.from('goals').select('valor_atual').eq('id', goal_id).single();
  const novoValor = (+goal.valor_atual) + (+valor);
  const { data, error } = await sb.from('goals')
    .update({ valor_atual: novoValor, updated_at: new Date().toISOString() })
    .eq('id', goal_id).select().single();
  return { data, error };
}

/* ─────────────────────────── INVESTMENTS ─────────────────────────── */

export async function getInvestments() {
  const { data } = await sb.from('investments').select('*').eq('ativo', true).order('created_at');
  return data || [];
}

export async function createInvestment(fields) {
  const user = await getUser();
  const { data, error } = await sb.from('investments').insert({ ...fields, user_id: user.id }).select().single();
  return { data, error };
}

export async function updateInvestment(id, fields) {
  const { data, error } = await sb.from('investments')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  return { data, error };
}

export async function deleteInvestment(id) {
  const { error } = await sb.from('investments').update({ ativo: false }).eq('id', id);
  return { error };
}

/* ─────────────────────────── ALERTS ─────────────────────────── */

export async function getAlerts(onlyUnread = false) {
  let q = sb.from('alerts').select('*').order('created_at', { ascending: false });
  if (onlyUnread) q = q.eq('lido', false);
  const { data } = await q;
  return data || [];
}

export async function markAlertRead(id) {
  await sb.from('alerts').update({ lido: true }).eq('id', id);
}

export async function createAlert(mensagem, tipo = 'info', agente = 'Sistema') {
  const user = await getUser();
  await sb.from('alerts').insert({ user_id: user.id, mensagem, tipo, agente });
}

/* ─────────────────────────── HELPERS ─────────────────────────── */

export function fmt(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

export function fmtDate(date) {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
}

export function categorias() {
  return [
    { v: 'alimentacao',   l: '🍽️ Alimentação' },
    { v: 'transporte',    l: '🚗 Transporte' },
    { v: 'saude',         l: '🏥 Saúde' },
    { v: 'educacao',      l: '📚 Educação' },
    { v: 'lazer',         l: '🎮 Lazer' },
    { v: 'moradia',       l: '🏠 Moradia' },
    { v: 'vestuario',     l: '👕 Vestuário' },
    { v: 'servicos',      l: '📱 Serviços/Assinaturas' },
    { v: 'salario',       l: '💼 Salário' },
    { v: 'freelance',     l: '💻 Freelance' },
    { v: 'investimentos', l: '📈 Investimentos' },
    { v: 'transferencia', l: '↔️ Transferência' },
    { v: 'outros',        l: '📦 Outros' },
  ];
}

export function metodos() {
  return [
    { v: 'pix',      l: 'Pix' },
    { v: 'credito',  l: 'Crédito' },
    { v: 'debito',   l: 'Débito' },
    { v: 'ted',      l: 'TED' },
    { v: 'doc',      l: 'DOC' },
    { v: 'dinheiro', l: 'Dinheiro' },
    { v: 'boleto',   l: 'Boleto' },
    { v: 'outros',   l: 'Outros' },
  ];
}
