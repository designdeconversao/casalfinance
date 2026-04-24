'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import confetti from 'canvas-confetti';
import TransactionModal, { TransactionFormData } from './TransactionModal';
import GoalModal, { GoalFormData } from './GoalModal';
import DepositModal, { DepositFormData } from './DepositModal';
import TransferModal from './TransferModal';
import WalletManagementModal from './WalletManagementModal';
import StepModal, { StepFormData } from './StepModal';
import ExportModal from './ExportModal';
import GoalCompletionModal from './GoalCompletionModal';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  isJoint: boolean;
  color: string;
}

interface Transaction {
  id: string; userId: string; type: string; scope: string; expenseType: string;
  description: string; amount: number; dueDate: string; categoryLabel: string;
  status: string; month: string; isRecurring: boolean; createdAt: string;
  installmentCurrent?: number; installmentTotal?: number;
  walletId?: string; destinationWalletId?: string;
  paidBy?: string; user1Amount?: number; user2Amount?: number;
}

interface GoalDeposit {
  id: string; goalId: string; userId: string; amount: number;
  depositDate: string; source: string; note: string; userName: string;
}

interface GoalStep {
  id: string; goalId: string; title: string; estimatedAmount: number;
  deadline: string; completed: boolean; completedAt?: string;
  order: number; note?: string;
}

interface Goal {
  id: string; createdByUserId: string; scope: string; title: string;
  description: string;
  icon: string;
  targetAmount: number;
  calcType?: 'fixed' | 'sum_of_steps';
  deadline: string;
  status: string; currentAmount: number; deposits: GoalDeposit[]; steps: GoalStep[];
}

interface Category { name: string; icon: string; color: string; }

const CHART_COLORS = ['#6366f1', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#f97316', '#14b8a6', '#ef4444', '#06b6d4', '#a855f7', '#64748b'];

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'extrato' | 'objetivos'>('dashboard');
  const [scope, setScope] = useState<string>('todos');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWalletMgmtModal, setShowWalletMgmtModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionGoalId, setCompletionGoalId] = useState<string | null>(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
  const [selectedGoalDetail, setSelectedGoalDetail] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams();
    if (scope !== 'todos') params.set('scope', scope);
    if (selectedMonth) params.set('month', selectedMonth);
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
  }, [scope, selectedMonth]);

  const fetchGoals = useCallback(async () => {
    const res = await fetch('/api/goals');
    const data = await res.json();
    setGoals(data.goals || []);
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data.categories || []);
  }, []);

  const fetchWallets = useCallback(async () => {
    const res = await fetch('/api/wallets');
    const data = await res.json();
    setWallets(data.wallets || []);
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { fetchGoals(); }, [fetchGoals]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  // --- Handlers ---
  const handleSaveTransaction = async (data: TransactionFormData) => {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchTransactions();
    fetchWallets();
  };

  const handleDeleteTransaction = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este lançamento?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTransactions();
        fetchWallets();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir lançamento');
      }
    } catch {
      alert('Erro de conexão ao excluir lançamento');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await fetch('/api/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchTransactions();
    fetchWallets();
  };

  const handleSaveGoal = async (data: GoalFormData) => {
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchGoals();
  };

  const handleDeleteGoal = async (id: string) => {
    const confirmed = window.confirm('Excluir este objetivo e todos os aportes?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGoals();
        setSelectedGoalDetail(null);
      } else {
        alert('Erro ao excluir objetivo');
      }
    } catch {
      alert('Erro de conexão ao excluir objetivo');
    }
  };

  const handleSaveDeposit = async (data: DepositFormData) => {
    await fetch('/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchGoals();
    fetchTransactions();
    fetchWallets();
  };

  const handleSaveStep = async (data: StepFormData) => {
    await fetch('/api/goals/steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchGoals();
  };

  const handleToggleStep = async (stepId: string, completed: boolean) => {
    if (completed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b']
      });
    }
    await fetch('/api/goals/steps', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: stepId, completed }),
    });
    fetchGoals();
  };

  const handleDeleteStep = async (stepId: string) => {
    const confirmed = window.confirm('Excluir esta etapa?');
    if (!confirmed) return;
    await fetch(`/api/goals/steps?id=${stepId}`, { method: 'DELETE' });
    fetchGoals();
  };

  const handleSaveTransfer = async (data: any) => {
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        handleTransferSuccess();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao realizar transferência');
      }
    } catch {
      alert('Erro de conexão');
    }
  };

  const handleTransferSuccess = () => {
    fetchWallets();
    fetchTransactions();
    setShowTransferModal(false);
  };

  const handleCompleteGoal = async (goalId: string, action: 'purchase' | 'refund', walletId?: string) => {
    try {
      const res = await fetch('/api/goals/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, action, walletId })
      });

      if (res.ok) {
        setShowCompletionModal(false);
        setSelectedGoalDetail(null);
        fetchGoals();
        fetchWallets();
        fetchTransactions();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao finalizar objetivo');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao finalizar objetivo');
    }
  };

  const handleAddWallet = async (data: any) => {
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchWallets();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao criar carteira');
      }
    } catch {
      alert('Erro de conexão');
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!window.confirm('Excluir esta conta?')) return;
    try {
      const res = await fetch(`/api/wallets?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWallets();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao excluir carteira');
      }
    } catch {
      alert('Erro de conexão');
    }
  };

  // --- Computed Data ---
  const entradas = transactions.filter(t => t.type === 'entrada');
  const saidas = transactions.filter(t => t.type === 'saida');
  const totalEntradas = entradas.reduce((s, t) => s + t.amount, 0);
  const totalSaidas = saidas.reduce((s, t) => s + t.amount, 0);
  const saldo = totalEntradas - totalSaidas;
  const atrasadas = saidas.filter(t => t.status === 'atrasado');
  const totalAtrasadas = atrasadas.reduce((s, t) => s + t.amount, 0);

  // Termômetro da Parceria (Casal)
  const casalSaidas = saidas.filter(t => t.scope === 'casal');
  const totalCasal = casalSaidas.reduce((s, t) => s + t.amount, 0);
  const rodrigoContrib = casalSaidas.reduce((sum, t) => {
    if (t.paidBy === 'rodrigo') return sum + t.amount;
    if (t.paidBy === 'ambos') return sum + (t.user1Amount || 0);
    return sum;
  }, 0);
  const mariContrib = casalSaidas.reduce((sum, t) => {
    if (t.paidBy === 'mari') return sum + t.amount;
    if (t.paidBy === 'ambos') return sum + (t.user2Amount || 0);
    return sum;
  }, 0);
  const conjuntaContrib = casalSaidas.reduce((sum, t) => {
    if (t.paidBy === 'conjunta') return sum + t.amount;
    return sum;
  }, 0);
  const rodrigoPct = totalCasal > 0 ? (rodrigoContrib / totalCasal) * 100 : 0;
  const mariPct = totalCasal > 0 ? (mariContrib / totalCasal) * 100 : 0;
  const conjuntaPct = totalCasal > 0 ? (conjuntaContrib / totalCasal) * 100 : 0;
  // Category chart data
  const catData = saidas.reduce((acc, t) => {
    const existing = acc.find(a => a.name === t.categoryLabel);
    if (existing) existing.value += t.amount;
    else acc.push({ name: t.categoryLabel, value: t.amount });
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value);

  // Bar chart data
  const months = Array.from(new Set(transactions.map(t => t.month))).sort();
  const allTxns = transactions;
  const barData = months.length > 0 ? months.map(m => ({
    month: m.slice(5, 7) + '/' + m.slice(2, 4),
    Entradas: allTxns.filter(t => t.month === m && t.type === 'entrada').reduce((s, t) => s + t.amount, 0),
    Saídas: allTxns.filter(t => t.month === m && t.type === 'saida').reduce((s, t) => s + t.amount, 0),
  })) : [{ month: selectedMonth.slice(5, 7) + '/' + selectedMonth.slice(2, 4), Entradas: totalEntradas, Saídas: totalSaidas }];

  // Filtered transactions for extrato
  let filteredTxns = transactions;
  if (filterType) filteredTxns = filteredTxns.filter(t => t.type === filterType);
  if (filterStatus) filteredTxns = filteredTxns.filter(t => t.status === filterStatus);
  if (filterCategory) filteredTxns = filteredTxns.filter(t => t.categoryLabel === filterCategory);

  const activeGoals = goals.filter(g => g.status === 'ativo');
  const completedGoals = goals.filter(g => g.status === 'concluido');

  // Goal detail
  const detailGoal = selectedGoalDetail ? goals.find(g => g.id === selectedGoalDetail) : null;

  const getComputedTargetAmount = (goal: Goal) => {
    if (goal.calcType === 'sum_of_steps') {
      return goal.steps ? goal.steps.reduce((sum, s) => sum + (s.estimatedAmount || 0), 0) : 0;
    }
    return goal.targetAmount;
  };

  const getGoalAnalysis = (goal: Goal) => {
    const today = new Date();
    const deadline = new Date(goal.deadline + 'T12:00:00');
    const diffMs = deadline.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const monthsRemaining = Math.max(0.1, daysRemaining / 30);
    const paidStepsValue = goal.steps ? goal.steps.filter(s => s.completed).reduce((sum, s) => sum + (s.estimatedAmount || 0), 0) : 0;
    const effectiveAmount = goal.currentAmount + paidStepsValue;
    const computedTargetAmount = getComputedTargetAmount(goal);
    const remaining = computedTargetAmount - effectiveAmount;
    const requiredPerMonth = remaining / monthsRemaining;

    // Calculate actual rhythm
    const deposits = goal.deposits || [];
    const firstDeposit = deposits.length > 0
      ? new Date(deposits.reduce((min, d) => d.depositDate < min ? d.depositDate : min, deposits[0].depositDate) + 'T12:00:00')
      : today;
    const monthsSinceStart = Math.max(1, (today.getTime() - firstDeposit.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const actualPerMonth = effectiveAmount / monthsSinceStart;

    const percent = computedTargetAmount > 0 ? Math.min(100, (effectiveAmount / computedTargetAmount) * 100) : 0;

    let riskLevel: 'on-track' | 'behind' | 'at-risk' = 'on-track';
    if (actualPerMonth < requiredPerMonth * 0.7) riskLevel = 'at-risk';
    else if (actualPerMonth < requiredPerMonth) riskLevel = 'behind';

    // Projection
    const projectedDays = actualPerMonth > 0 ? (remaining / actualPerMonth) * 30 : Infinity;
    const projectedDate = new Date(today.getTime() + projectedDays * 24 * 60 * 60 * 1000);

    return { daysRemaining, monthsRemaining, remaining, requiredPerMonth, actualPerMonth, percent, riskLevel, projectedDate, computedTargetAmount, effectiveAmount };
  };

  const getCatIcon = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat?.icon || '📌';
  };

  const partnerName = user?.role === 'rodrigo' ? 'Mari' : 'Rodrigo';

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-brand-icon">💰</span>
            <h1>CasalFinance</h1>
          </div>

          <nav className="header-nav">
            <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
            <button className={`nav-btn ${activeTab === 'extrato' ? 'active' : ''}`}
              onClick={() => setActiveTab('extrato')}>📋 Extrato</button>
            <button className={`nav-btn ${activeTab === 'objetivos' ? 'active' : ''}`}
              onClick={() => setActiveTab('objetivos')}>🎯 Objetivos</button>
          </nav>

          <div className="header-actions">
            <div className="header-user">
              <div className={`header-user-avatar ${user?.role}`}>
                {user?.name?.charAt(0)}
              </div>
              <span className="header-user-name">{user?.name?.split(' ')[0]}</span>
            </div>
            <button className="logout-btn" onClick={logout}>Sair</button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="mobile-nav">
        <div className="mobile-nav-inner">
          <button className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}>
            <span className="icon">📊</span>Dashboard
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'extrato' ? 'active' : ''}`}
            onClick={() => setActiveTab('extrato')}>
            <span className="icon">📋</span>Extrato
          </button>
          <button className={`mobile-nav-btn ${activeTab === 'objetivos' ? 'active' : ''}`}
            onClick={() => setActiveTab('objetivos')}>
            <span className="icon">🎯</span>Objetivos
          </button>
        </div>
      </div>

      <main className="app-main">

        {/* ====== DASHBOARD TAB ====== */}
        {activeTab === 'dashboard' && (
          <>
            {/* Scope Tabs */}
            <div className="scope-tabs">
              <button className={`scope-tab ${scope === 'todos' ? 'active' : ''}`} onClick={() => setScope('todos')}>
                📊 Meu Financeiro
              </button>
              <button className={`scope-tab ${scope === 'casal' ? 'active' : ''}`} onClick={() => setScope('casal')}>
                💑 Casal
              </button>
              <button className={`scope-tab ${scope === 'parceiro' ? 'active' : ''}`} onClick={() => setScope('parceiro')}>
                👤 {partnerName}
              </button>
            </div>

            {/* Month selector */}
            <div className="filters-bar" style={{ marginTop: 20 }}>
              <input type="month" className="form-input" value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)} />
            </div>

            {/* Wallets Display */}
            <div className="wallets-row">
              {wallets.map(w => (
                <div key={w.id} className="wallet-mini-card" style={{ borderLeftColor: w.color }}>
                  <div className="wallet-mini-info">
                    <span className="wallet-mini-name">{w.name} {w.isJoint ? '💑' : ''}</span>
                    <span className="wallet-mini-balance">{formatCurrency(w.balance)}</span>
                  </div>
                </div>
              ))}
              <button className="wallet-transfer-btn" onClick={() => setShowTransferModal(true)} title="Transferir entre carteiras">
                🔄
              </button>
              <button className="wallet-add-btn" onClick={() => setShowWalletMgmtModal(true)}>
                ⚙️
              </button>
            </div>

            {/* Alert atrasadas */}
            {atrasadas.length > 0 && (
              <div className="alert-card warning">
                <span className="alert-icon">⚠️</span>
                <span className="alert-text">
                  <span className="alert-count">{atrasadas.length} conta{atrasadas.length > 1 ? 's' : ''} atrasada{atrasadas.length > 1 ? 's' : ''}</span>
                  {' '}totalizando {formatCurrency(totalAtrasadas)}
                </span>
              </div>
            )}

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card green">
                <div className="stat-card-label">Entradas</div>
                <div className="stat-card-value">{formatCurrency(totalEntradas)}</div>
                <div className="stat-card-sub">{entradas.length} lançamento{entradas.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="stat-card red">
                <div className="stat-card-label">Saídas</div>
                <div className="stat-card-value">{formatCurrency(totalSaidas)}</div>
                <div className="stat-card-sub">{saidas.length} lançamento{saidas.length !== 1 ? 's' : ''}</div>
              </div>
              <div className={`stat-card ${saldo >= 0 ? 'blue' : 'red'}`}>
                <div className="stat-card-label">Saldo</div>
                <div className="stat-card-value">{formatCurrency(saldo)}</div>
                <div className="stat-card-sub">{saldo >= 0 ? '📈 Positivo' : '📉 Negativo'}</div>
              </div>
              {activeGoals.length > 0 && (
                <div className="stat-card purple">
                  <div className="stat-card-label">Objetivos Ativos</div>
                  <div className="stat-card-value">{activeGoals.length}</div>
                  <div className="stat-card-sub">{completedGoals.length} concluído{completedGoals.length !== 1 ? 's' : ''}</div>
                </div>
              )}
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="content-card">
                <div className="content-card-header">
                  <span className="content-card-title">📈 Entradas vs Saídas</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => formatCurrency(Number(value))}
                      contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Bar dataKey="Entradas" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Saídas" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="content-card">
                <div className="content-card-header">
                  <span className="content-card-title">🍩 Categorias de Saída</span>
                </div>
                {catData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                        paddingAngle={2} dataKey="value" nameKey="name">
                        {catData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">🍩</div>
                    <div className="empty-state-text">Sem dados de saída</div>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {catData.map((cat, i) => (
                    <span key={cat.name} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], display: 'inline-block' }} />
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Termômetro da Parceria */}
            <div className="content-card">
              <div className="content-card-header">
                <span className="content-card-title">🤝 Esforço Conjunto do Mês</span>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Total Casal: {formatCurrency(totalCasal)}</span>
              </div>
              <div style={{ marginTop: 15, marginBottom: 5 }}>
                <div style={{ display: 'flex', width: '100%', height: 12, borderRadius: 6, overflow: 'hidden', background: '#1e293b' }}>
                  <div style={{ width: `${rodrigoPct}%`, background: '#3b82f6', transition: 'width 0.5s ease' }} title="Rodrigo" />
                  <div style={{ width: `${mariPct}%`, background: '#ec4899', transition: 'width 0.5s ease' }} title="Mari" />
                  <div style={{ width: `${conjuntaPct}%`, background: '#10b981', transition: 'width 0.5s ease' }} title="Conta Conjunta" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                  Rodrigo: {formatCurrency(rodrigoContrib)} ({rodrigoPct.toFixed(0)}%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Conjunta: {formatCurrency(conjuntaContrib)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899', display: 'inline-block' }} />
                  Mari: {formatCurrency(mariContrib)} ({mariPct.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Goals Preview on Dashboard */}
            {activeGoals.length > 0 && (
              <div className="content-card">
                <div className="content-card-header">
                  <span className="content-card-title">🎯 Objetivos Ativos</span>
                  <button className="btn-secondary btn-sm" onClick={() => setActiveTab('objetivos')}>Ver todos</button>
                </div>
                <div className="goals-grid">
                  {activeGoals.slice(0, 3).map(goal => {
                    const analysis = getGoalAnalysis(goal);
                    return (
                      <div key={goal.id} className="goal-card">
                        <div className="goal-card-header">
                          <div className="goal-card-title">
                            <span className="goal-card-icon">{goal.icon}</span>
                            <div>
                              <div className="goal-card-name">{goal.title}</div>
                              <div className="goal-card-scope">{goal.description}</div>
                            </div>
                          </div>
                          <span className={`goal-card-badge ${goal.scope}`}>{goal.scope}</span>
                        </div>
                        <div className="goal-progress-text">
                          <span className="goal-progress-amount">{formatCurrency(analysis.effectiveAmount)} de {formatCurrency(analysis.computedTargetAmount)}</span>
                          <span className="goal-progress-percent">{analysis.percent.toFixed(0)}%</span>
                        </div>
                        <div className="goal-progress-bar">
                          <div className={`goal-progress-fill ${analysis.riskLevel}`}
                            style={{ width: `${analysis.percent}%` }} />
                        </div>
                        <div className="goal-countdown">
                          ⏱️ {analysis.daysRemaining} dias restantes
                        </div>
                        <div className="goal-card-actions">
                          <button className="btn-green btn-sm btn-icon" onClick={() => {
                            setSelectedGoalId(goal.id);
                            setShowDepositModal(true);
                          }}>💰 Depositar</button>
                          <button className="btn-secondary btn-sm" onClick={() => {
                            setSelectedGoalDetail(goal.id);
                            setActiveTab('objetivos');
                          }}>📋 Detalhes</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="content-card">
              <div className="content-card-header">
                <span className="content-card-title">📋 Últimos Lançamentos</span>
                <button className="btn-secondary btn-sm" onClick={() => setActiveTab('extrato')}>Ver todos</button>
              </div>
              {transactions.length > 0 ? (
                <div className="transactions-list">
                  {transactions.slice(0, 8).map(txn => (
                    <div key={txn.id} className="transaction-item">
                      <div className="transaction-desc">
                        <span className="transaction-cat-icon">{getCatIcon(txn.categoryLabel)}</span>
                        <div>
                          <div className="transaction-name">{txn.description}</div>
                          <div className="transaction-cat">
                            {txn.categoryLabel}
                            {txn.scope === 'casal' && ' · 💑 Casal'}
                          </div>
                        </div>
                      </div>
                      <span className={`transaction-amount ${txn.type}`}>
                        {txn.type === 'entrada' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </span>
                      <span className="transaction-date">{formatDate(txn.dueDate)}</span>
                      <span className={`transaction-status status-${txn.status}`}>
                        {txn.status === 'pago' ? 'Pago' : txn.status === 'atrasado' ? 'Atrasado' :
                          txn.status === 'a_vencer' ? 'À Vencer' : txn.status === 'recebido' ? 'Recebido' : 'À Receber'}
                      </span>
                      <div className="transaction-actions">
                        {txn.status !== 'pago' && txn.status !== 'recebido' && (
                          <button title="Marcar como pago/recebido"
                            onClick={() => handleUpdateStatus(txn.id, txn.type === 'entrada' ? 'recebido' : 'pago')}>
                            ✅
                          </button>
                        )}
                        <button className="delete" title="Excluir" onClick={() => handleDeleteTransaction(txn.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">Nenhum lançamento neste mês</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ====== EXTRATO TAB ====== */}
        {activeTab === 'extrato' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>📋 Extrato Detalhado</h2>
              <button className="btn-secondary" onClick={() => setShowExportModal(true)}>
                ⬇️ Exportar CSV
              </button>
            </div>

            <div className="scope-tabs">
              <button className={`scope-tab ${scope === 'todos' ? 'active' : ''}`} onClick={() => setScope('todos')}>
                📊 Meu Financeiro
              </button>
              <button className={`scope-tab ${scope === 'casal' ? 'active' : ''}`} onClick={() => setScope('casal')}>
                💑 Casal
              </button>
              <button className={`scope-tab ${scope === 'parceiro' ? 'active' : ''}`} onClick={() => setScope('parceiro')}>
                👤 {partnerName}
              </button>
            </div>

            <div className="filters-bar">
              <input type="month" className="form-input" value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)} />
              <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">Todos os tipos</option>
                <option value="entrada">📥 Entradas</option>
                <option value="saida">📤 Saídas</option>
              </select>
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
                <option value="a_vencer">À Vencer</option>
                <option value="recebido">Recebido</option>
                <option value="a_receber">À Receber</option>
              </select>
              <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">Todas as categorias</option>
                {categories.map(c => (
                  <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Summary cards */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
              <div className="stat-card green">
                <div className="stat-card-label">Entradas Filtradas</div>
                <div className="stat-card-value">{formatCurrency(filteredTxns.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0))}</div>
              </div>
              <div className="stat-card red">
                <div className="stat-card-label">Saídas Filtradas</div>
                <div className="stat-card-value">{formatCurrency(filteredTxns.filter(t => t.type === 'saida').reduce((s, t) => s + t.amount, 0))}</div>
              </div>
              <div className="stat-card blue">
                <div className="stat-card-label">Total de Registros</div>
                <div className="stat-card-value">{filteredTxns.length}</div>
              </div>
            </div>

            <div className="content-card">
              {filteredTxns.length > 0 ? (
                <div className="transactions-list">
                  {filteredTxns.map(txn => (
                    <div key={txn.id} className="transaction-item">
                      <div className="transaction-desc">
                        <span className="transaction-cat-icon">{getCatIcon(txn.categoryLabel)}</span>
                        <div>
                          <div className="transaction-name">
                            {txn.description}
                            {txn.installmentCurrent && txn.installmentTotal && (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                                ({txn.installmentCurrent}/{txn.installmentTotal})
                              </span>
                            )}
                          </div>
                          <div className="transaction-cat">
                            {txn.categoryLabel} · {txn.expenseType === 'fixo' ? '📌 Fixo' : '🔄 Flexível'}
                            {txn.scope === 'casal' && ' · 💑 Casal'}
                            {txn.isRecurring && ' · 🔁'}
                          </div>
                        </div>
                      </div>
                      <span className={`transaction-amount ${txn.type}`}>
                        {txn.type === 'entrada' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </span>
                      <span className="transaction-date">{formatDate(txn.dueDate)}</span>
                      <span className={`transaction-status status-${txn.status}`}>
                        {txn.status === 'pago' ? 'Pago' : txn.status === 'atrasado' ? 'Atrasado' :
                          txn.status === 'a_vencer' ? 'À Vencer' : txn.status === 'recebido' ? 'Recebido' : 'À Receber'}
                      </span>
                      <div className="transaction-actions">
                        {txn.status !== 'pago' && txn.status !== 'recebido' && (
                          <button title="Marcar como pago"
                            onClick={() => handleUpdateStatus(txn.id, txn.type === 'entrada' ? 'recebido' : 'pago')}>✅</button>
                        )}
                        <button className="delete" title="Excluir"
                          onClick={() => handleDeleteTransaction(txn.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">Nenhum lançamento encontrado com esses filtros</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ====== OBJETIVOS TAB ====== */}
        {activeTab === 'objetivos' && !selectedGoalDetail && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>🎯 Objetivos Financeiros</h2>
              <button className="btn-primary btn-icon" style={{ width: 'auto' }}
                onClick={() => setShowGoalModal(true)}>
                ➕ Novo Objetivo
              </button>
            </div>

            {activeGoals.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 16 }}>Ativos</h3>
                <div className="goals-grid">
                  {activeGoals.map(goal => {
                    const analysis = getGoalAnalysis(goal);
                    return (
                      <div key={goal.id} className="goal-card">
                        <div className="goal-card-header">
                          <div className="goal-card-title">
                            <span className="goal-card-icon">{goal.icon}</span>
                            <div>
                              <div className="goal-card-name">{goal.title}</div>
                              <div className="goal-card-scope">{goal.description}</div>
                            </div>
                          </div>
                          <span className={`goal-card-badge ${goal.scope}`}>{goal.scope}</span>
                        </div>

                        <div className="goal-progress-text">
                          <span className="goal-progress-amount">{formatCurrency(analysis.effectiveAmount)} de {formatCurrency(analysis.computedTargetAmount)}</span>
                          <span className="goal-progress-percent">{analysis.percent.toFixed(0)}%</span>
                        </div>
                        <div className="goal-progress-bar">
                          <div className={`goal-progress-fill ${analysis.riskLevel}`}
                            style={{ width: `${analysis.percent}%` }} />
                        </div>

                        <div className="goal-countdown">
                          ⏱️ {analysis.daysRemaining} dias restantes ({formatDate(goal.deadline)})
                        </div>

                        <div className="goal-rhythm">
                          📊 Ritmo: {formatCurrency(analysis.actualPerMonth)}/mês
                          {analysis.riskLevel !== 'on-track' && (
                            <span style={{ color: analysis.riskLevel === 'at-risk' ? 'var(--red)' : 'var(--yellow)' }}>
                              {' '}· Ideal: {formatCurrency(analysis.requiredPerMonth)}/mês
                            </span>
                          )}
                        </div>

                        <div className="goal-card-actions">
                          <button className="btn-green btn-sm btn-icon" onClick={() => {
                            setSelectedGoalId(goal.id);
                            setShowDepositModal(true);
                          }}>💰 Depositar</button>
                          <button className="btn-secondary btn-sm" onClick={() => setSelectedGoalDetail(goal.id)}>
                            📋 Detalhes
                          </button>
                          <button className="btn-danger btn-sm" onClick={() => handleDeleteGoal(goal.id)}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {completedGoals.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 16, marginTop: 32 }}>🏆 Conquistas</h3>
                <div className="goals-grid">
                  {completedGoals.map(goal => (
                    <div key={goal.id} className="goal-card" style={{ opacity: 0.7 }}>
                      <div className="goal-card-header">
                        <div className="goal-card-title">
                          <span className="goal-card-icon">{goal.icon}</span>
                          <div>
                            <div className="goal-card-name">{goal.title} ✅</div>
                            <div className="goal-card-scope">{formatCurrency(getComputedTargetAmount(goal))} alcançado!</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {goals.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <div className="empty-state-text">Nenhum objetivo criado ainda</div>
                <button className="btn-primary" style={{ width: 'auto', margin: '16px auto 0' }}
                  onClick={() => setShowGoalModal(true)}>
                  Criar primeiro objetivo
                </button>
              </div>
            )}
          </>
        )}

        {/* ====== GOAL DETAIL ====== */}
        {activeTab === 'objetivos' && detailGoal && (
          <>
            <button className="btn-secondary btn-sm" style={{ marginBottom: 16 }}
              onClick={() => setSelectedGoalDetail(null)}>
              ← Voltar
            </button>

            <div className="goal-detail-header">
              <span className="goal-detail-icon">{detailGoal.icon}</span>
              <div>
                <h2 className="goal-detail-title">{detailGoal.title}</h2>
                {detailGoal.description && <p className="goal-detail-desc">{detailGoal.description}</p>}
              </div>
            </div>

            {(() => {
              const analysis = getGoalAnalysis(detailGoal);
              return (
                <>
                  {/* Stats cards */}
                  <div className="stats-grid">
                    <div className="stat-card purple">
                      <div className="stat-card-label">Meta</div>
                      <div className="stat-card-value">{formatCurrency(analysis.computedTargetAmount)}</div>
                    </div>
                    <div className="stat-card green">
                      <div className="stat-card-label">Guardado</div>
                      <div className="stat-card-value">{formatCurrency(analysis.effectiveAmount)}</div>
                    </div>
                    <div className="stat-card gold">
                      <div className="stat-card-label">Faltam</div>
                      <div className="stat-card-value">{formatCurrency(analysis.remaining)}</div>
                    </div>
                    <div className="stat-card purple" style={{ cursor: 'pointer' }} onClick={() => {
                      setCompletionGoalId(detailGoal.id);
                      setShowCompletionModal(true);
                    }}>
                      <div className="stat-card-label">Status</div>
                      <div className="stat-card-value">Finalizar ✨</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="content-card">
                    <div className="content-card-title" style={{ marginBottom: 12 }}>📊 Progresso</div>
                    <div className="goal-progress-bar" style={{ height: 16, borderRadius: 8 }}>
                      <div className={`goal-progress-fill ${analysis.riskLevel}`}
                        style={{ width: `${analysis.percent}%` }} />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 8, fontSize: 20, fontWeight: 700 }}>
                      {analysis.percent.toFixed(1)}%
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="content-card">
                    <div className="content-card-title" style={{ marginBottom: 12 }}>⏱️ Contagem Regressiva</div>
                    <div className="countdown-display">
                      <div className="countdown-item">
                        <div className="countdown-value">{Math.floor(analysis.daysRemaining / 30)}</div>
                        <div className="countdown-label">Meses</div>
                      </div>
                      <div className="countdown-item">
                        <div className="countdown-value">{analysis.daysRemaining % 30}</div>
                        <div className="countdown-label">Dias</div>
                      </div>
                    </div>
                  </div>

                  {/* Rhythm Analysis */}
                  <div className="content-card">
                    <div className="content-card-title" style={{ marginBottom: 12 }}>📈 Análise de Ritmo</div>
                    <div className="rhythm-card">
                      <div className="rhythm-row">
                        <span className="rhythm-label">Ritmo atual</span>
                        <span className="rhythm-value">{formatCurrency(analysis.actualPerMonth)}/mês</span>
                      </div>
                      <div className="rhythm-row">
                        <span className="rhythm-label">Ritmo necessário</span>
                        <span className={`rhythm-value ${analysis.riskLevel === 'on-track' ? 'success' : analysis.riskLevel === 'behind' ? 'warning' : 'danger'}`}>
                          {formatCurrency(analysis.requiredPerMonth)}/mês
                        </span>
                      </div>
                      <div className="rhythm-row">
                        <span className="rhythm-label">Projeção</span>
                        <span className="rhythm-value">
                          {analysis.actualPerMonth > 0
                            ? analysis.projectedDate.toLocaleDateString('pt-BR')
                            : 'Sem dados'}
                        </span>
                      </div>
                      {analysis.riskLevel !== 'on-track' && (
                        <div className="rhythm-tip">
                          💡 Aumente {formatCurrency(analysis.requiredPerMonth - analysis.actualPerMonth)}/mês para atingir no prazo!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deposits evolution chart */}
                  {detailGoal.deposits.length > 0 && (
                    <div className="content-card">
                      <div className="content-card-title" style={{ marginBottom: 12 }}>📊 Evolução dos Aportes</div>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={
                          detailGoal.deposits
                            .sort((a, b) => a.depositDate.localeCompare(b.depositDate))
                            .reduce((acc, d) => {
                              const prev = acc.length > 0 ? acc[acc.length - 1].acumulado : 0;
                              acc.push({ date: formatDate(d.depositDate), acumulado: prev + d.amount, meta: analysis.computedTargetAmount });
                              return acc;
                            }, [] as { date: string; acumulado: number; meta: number }[])
                        }>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => formatCurrency(Number(value))}
                            contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                          />
                          <Line type="monotone" dataKey="acumulado" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }} />
                          <Line type="monotone" dataKey="meta" stroke="#64748b" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Goal Steps (Roadmap) */}
                  <div className="content-card">
                    <div className="content-card-header">
                      <span className="content-card-title">🗺️ Etapas (Roadmap)</span>
                      <button className="btn-primary btn-sm btn-icon" onClick={() => {
                        setSelectedGoalId(detailGoal.id);
                        setShowStepModal(true);
                      }}>➕ Nova Etapa</button>
                    </div>
                    {detailGoal.steps && detailGoal.steps.length > 0 ? (
                      <div className="steps-list">
                        {detailGoal.steps
                          .sort((a, b) => a.order - b.order)
                          .map(step => (
                            <div key={step.id} className={`step-item ${step.completed ? 'completed' : ''}`}>
                              <label className="switch">
                                <input
                                  type="checkbox"
                                  checked={step.completed}
                                  onChange={(e) => handleToggleStep(step.id, e.target.checked)}
                                />
                                <span className="slider round"></span>
                              </label>
                              <div className="step-content">
                                <div className="step-title">{step.title}</div>
                                {step.note && <div className="step-note">{step.note}</div>}
                                <div className="step-meta">
                                  {step.estimatedAmount > 0 && (
                                    <span className="step-amount">💰 {formatCurrency(step.estimatedAmount)}</span>
                                  )}
                                  <span className="step-deadline">📅 {formatDate(step.deadline)}</span>
                                  {step.completed && step.completedAt && (
                                    <span className="step-completed-date">✅ Concluído em {formatDate(step.completedAt)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="step-actions">
                                <button className="delete" title="Excluir Etapa" onClick={() => handleDeleteStep(step.id)}>🗑️</button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">🗺️</div>
                        <div className="empty-state-text">Nenhuma etapa definida para este objetivo.</div>
                      </div>
                    )}
                  </div>

                  {/* Deposits history */}
                  <div className="content-card">
                    <div className="content-card-header">
                      <span className="content-card-title">📋 Histórico de Aportes</span>
                      <button className="btn-green btn-sm btn-icon" onClick={() => {
                        setSelectedGoalId(detailGoal.id);
                        setShowDepositModal(true);
                      }}>💰 Novo Aporte</button>
                    </div>
                    {detailGoal.deposits.length > 0 ? (
                      <div className="transactions-list">
                        {detailGoal.deposits
                          .sort((a, b) => b.depositDate.localeCompare(a.depositDate))
                          .map(dep => (
                            <div key={dep.id} className="transaction-item" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
                              <div className="transaction-desc">
                                <span className="transaction-cat-icon">💰</span>
                                <div>
                                  <div className="transaction-name">{dep.userName}</div>
                                  <div className="transaction-cat">{dep.source}{dep.note ? ` · ${dep.note}` : ''}</div>
                                </div>
                              </div>
                              <span className="transaction-amount entrada">+{formatCurrency(dep.amount)}</span>
                              <span className="transaction-date">{formatDate(dep.depositDate)}</span>
                              <div className="transaction-actions">
                                <button className="delete" onClick={async () => {
                                  const confirmed = window.confirm('Excluir este aporte?');
                                  if (!confirmed) return;
                                  try {
                                    const res = await fetch(`/api/deposits?id=${dep.id}`, { method: 'DELETE' });
                                    if (res.ok) fetchGoals();
                                    else alert('Erro ao excluir aporte');
                                  } catch { alert('Erro de conexão'); }
                                }}>🗑️</button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">💰</div>
                        <div className="empty-state-text">Nenhum aporte registrado ainda</div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </>
        )}
        {/* Completion Modal */}
        {completionGoalId && (
          <GoalCompletionModal
            isOpen={showCompletionModal}
            onClose={() => setShowCompletionModal(false)}
            onConfirm={(action, walletId) => handleCompleteGoal(completionGoalId, action, walletId)}
            goalTitle={goals.find(g => g.id === completionGoalId)?.title || ''}
            amount={getGoalAnalysis(goals.find(g => g.id === completionGoalId)!).effectiveAmount}
            wallets={wallets}
          />
        )}
        {/* Wallet Management Modal */}
        <WalletManagementModal 
          isOpen={showWalletMgmtModal}
          onClose={() => setShowWalletMgmtModal(false)}
          wallets={wallets}
          onAdd={handleAddWallet}
          onDelete={handleDeleteWallet}
        />
      </main>

      {/* FAB Button */}
      <button className="fab-btn" title="Novo Lançamento" onClick={() => setShowTxnModal(true)}>+</button>

      {/* Modals */}
      <TransactionModal
        isOpen={showTxnModal}
        onClose={() => setShowTxnModal(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        onCategoryCreated={fetchCategories}
        wallets={wallets}
      />
      <GoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSave={handleSaveGoal}
      />
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => { setShowDepositModal(false); setSelectedGoalId(undefined); }}
        onSave={handleSaveDeposit}
        goals={activeGoals.map(g => ({ id: g.id, title: g.title, icon: g.icon }))}
        preselectedGoalId={selectedGoalId}
        wallets={wallets}
      />
      <StepModal
        isOpen={showStepModal}
        onClose={() => { setShowStepModal(false); setSelectedGoalId(undefined); }}
        onSave={handleSaveStep}
        goalId={selectedGoalId || ''}
        goalTitle={activeGoals.find(g => g.id === selectedGoalId)?.title || ''}
      />
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        transactions={transactions.filter(t => scope === 'todos' || t.scope === scope)}
      />
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSave={handleSaveTransfer}
        wallets={wallets}
      />
    </div>
  );
}
