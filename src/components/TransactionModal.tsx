'use client';

import { useState, useEffect } from 'react';
import CurrencyInput, { centsToReais, reaisToCents } from './CurrencyInput';

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionFormData) => Promise<void>;
  categories: { name: string; icon: string }[];
  onCategoryCreated?: () => void;
  editData?: TransactionFormData & { id: string };
  wallets: { id: string; name: string; balance: number; color: string }[];
}

export interface TransactionFormData {
  type: 'entrada' | 'saida';
  scope: 'pessoal' | 'casal';
  expenseType: 'fixo' | 'flexivel';
  description: string;
  amount: string;
  dueDate: string;
  categoryLabel: string;
  status: string;
  installmentCurrent?: string;
  installmentTotal?: string;
  isRecurring: boolean;
  month: string;
  paidBy?: 'rodrigo' | 'mari' | 'conjunta' | 'ambos';
  rodrigoAmount?: string;
  mariAmount?: string;
  walletId?: string;
}

const CATEGORY_ICONS = ['📌', '🏠', '💊', '📱', '🛠️', '💳', '📦', '🚗', '🛒', '🍔', '🎬', '🎓', '👕', '🐾', '💇', '🎵', '📚', '⚽', '🎨', '🏋️', '💡', '🧹'];
const CATEGORY_COLORS = ['#64748b', '#6366f1', '#ec4899', '#3b82f6', '#8b5cf6', '#f59e0b', '#14b8a6', '#f97316', '#22c55e', '#ef4444', '#a855f7', '#06b6d4'];

export default function TransactionModal({ isOpen, onClose, onSave, categories, onCategoryCreated, editData, wallets }: TransactionModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [form, setForm] = useState<TransactionFormData>(editData || {
    type: 'saida',
    scope: 'pessoal',
    expenseType: 'flexivel',
    description: '',
    amount: '0',
    dueDate: today,
    categoryLabel: categories[0]?.name || 'Outros',
    status: 'pago',
    installmentCurrent: '',
    installmentTotal: '',
    isRecurring: false,
    month: currentMonth,
    paidBy: 'rodrigo',
    rodrigoAmount: '0',
    mariAmount: '0',
    walletId: '',
  });

  const [saving, setSaving] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📌');
  const [newCatColor, setNewCatColor] = useState('#64748b');
  const [catError, setCatError] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(editData || {
        type: 'saida',
        scope: 'pessoal',
        expenseType: 'flexivel',
        description: '',
        amount: '0',
        dueDate: today,
        categoryLabel: categories[0]?.name || 'Outros',
        status: 'pago',
        installmentCurrent: '',
        installmentTotal: '',
        isRecurring: false,
        month: currentMonth,
        paidBy: 'rodrigo',
        rodrigoAmount: '0',
        mariAmount: '0',
        walletId: '',
      });
      setShowNewCategory(false);
      setNewCatName('');
      setNewCatIcon('📌');
      setNewCatColor('#64748b');
      setCatError('');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAmount = 0;
    
    if (form.scope === 'casal' && form.type === 'saida' && form.paidBy === 'ambos') {
      const rod = centsToReais(form.rodrigoAmount || '0');
      const mari = centsToReais(form.mariAmount || '0');
      finalAmount = rod + mari;
    } else {
      finalAmount = centsToReais(form.amount);
    }
    
    if (finalAmount <= 0) {
      alert('O valor deve ser maior que zero.');
      return;
    }
    
    setSaving(true);
    await onSave({ 
      ...form, 
      amount: finalAmount.toFixed(2),
      rodrigoAmount: centsToReais(form.rodrigoAmount || '0').toFixed(2),
      mariAmount: centsToReais(form.mariAmount || '0').toFixed(2)
    });
    setSaving(false);
    onClose();
  };

  const update = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      setCatError('Digite o nome da categoria');
      return;
    }

    setCreatingCat(true);
    setCatError('');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), icon: newCatIcon, color: newCatColor }),
      });

      if (res.status === 409) {
        setCatError('Essa categoria já existe');
        setCreatingCat(false);
        return;
      }

      if (!res.ok) {
        setCatError('Erro ao criar categoria');
        setCreatingCat(false);
        return;
      }

      // Success: select the new category and close the new category form
      update('categoryLabel', newCatName.trim());
      setShowNewCategory(false);
      setNewCatName('');
      onCategoryCreated?.();
    } catch {
      setCatError('Erro de conexão');
    }
    setCreatingCat(false);
  };

  const statusOptions = form.type === 'entrada'
    ? [{ value: 'recebido', label: 'Recebido' }, { value: 'a_receber', label: 'À Receber' }]
    : [{ value: 'pago', label: 'Pago' }, { value: 'atrasado', label: 'Atrasado' }, { value: 'a_vencer', label: 'À Vencer' }];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editData ? '✏️ Editar Lançamento' : '➕ Novo Lançamento'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type Toggle */}
          <div className="form-group">
            <label>Tipo</label>
            <div className="form-toggle-group">
              <button type="button" className={`form-toggle-btn ${form.type === 'saida' ? 'active' : ''}`}
                onClick={() => { update('type', 'saida'); update('status', 'pago'); }}>
                📤 Saída
              </button>
              <button type="button" className={`form-toggle-btn ${form.type === 'entrada' ? 'active' : ''}`}
                onClick={() => { update('type', 'entrada'); update('status', 'recebido'); }}>
                📥 Entrada
              </button>
            </div>
          </div>

          {/* Scope Toggle */}
          <div className="form-group">
            <label>Escopo</label>
            <div className="form-toggle-group">
              <button type="button" className={`form-toggle-btn ${form.scope === 'pessoal' ? 'active' : ''}`}
                onClick={() => update('scope', 'pessoal')}>
                👤 Pessoal
              </button>
              <button type="button" className={`form-toggle-btn ${form.scope === 'casal' ? 'active' : ''}`}
                onClick={() => update('scope', 'casal')}>
                💑 Casal
              </button>
            </div>
          </div>

          {/* Expense Type */}
          {form.type === 'saida' && (
            <div className="form-group">
              <label>Tipo de Custo</label>
              <div className="form-toggle-group">
                <button type="button" className={`form-toggle-btn ${form.expenseType === 'fixo' ? 'active' : ''}`}
                  onClick={() => update('expenseType', 'fixo')}>
                  📌 Fixo
                </button>
                <button type="button" className={`form-toggle-btn ${form.expenseType === 'flexivel' ? 'active' : ''}`}
                  onClick={() => update('expenseType', 'flexivel')}>
                  🔄 Flexível
                </button>
              </div>
            </div>
          )}

          {/* Who paid (Only for Casal Saídas) */}
          {form.scope === 'casal' && form.type === 'saida' && (
            <div className="form-group">
              <label>Quem pagou?</label>
              <select 
                className="form-input" 
                value={form.paidBy || 'rodrigo'} 
                onChange={(e) => update('paidBy', e.target.value)}
              >
                <option value="rodrigo">Rodrigo</option>
                <option value="mari">Mari</option>
                <option value="conjunta">Conta Conjunta</option>
                <option value="ambos">Dividido na hora</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label>Descrição</label>
            <input type="text" className="form-input" placeholder="Ex: Energia Elétrica, Salário..."
              value={form.description} onChange={e => update('description', e.target.value)} required />
          </div>

          {/* Wallet Selection */}
          <div className="form-group">
            <label>{form.type === 'entrada' ? 'Receber em qual carteira?' : 'Abater de qual carteira?'}</label>
            <div className="wallet-selector-grid">
              {wallets.map(w => (
                <div key={w.id} 
                  className={`wallet-option ${form.walletId === w.id ? 'active' : ''}`}
                  onClick={() => update('walletId', w.id)}
                >
                  <span className="wallet-option-name">{w.name}</span>
                  <span className="wallet-option-balance">{formatCurrency(w.balance)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value + Date */}
          <div className="form-row">
            {form.scope === 'casal' && form.type === 'saida' && form.paidBy === 'ambos' ? (
              <>
                <div className="form-group">
                  <label>R$ Rodrigo</label>
                  <CurrencyInput
                    value={form.rodrigoAmount || '0'}
                    onChange={(raw) => update('rodrigoAmount', raw)}
                  />
                </div>
                <div className="form-group">
                  <label>R$ Mari</label>
                  <CurrencyInput
                    value={form.mariAmount || '0'}
                    onChange={(raw) => update('mariAmount', raw)}
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label>Valor (R$)</label>
                <CurrencyInput
                  value={form.amount}
                  onChange={(rawCents) => update('amount', rawCents)}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Data</label>
              <input type="date" className="form-input" value={form.dueDate}
                onChange={e => update('dueDate', e.target.value)} required />
            </div>
          </div>

          {/* Category + Status */}
          <div className="form-row">
            <div className="form-group">
              <label>Categoria</label>
              {!showNewCategory ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <select className="form-select" value={form.categoryLabel}
                    onChange={e => update('categoryLabel', e.target.value)}
                    style={{ flex: 1 }}>
                    {categories.map(c => (
                      <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                  <button type="button" 
                    className="btn-add-category"
                    title="Criar nova categoria"
                    onClick={() => setShowNewCategory(true)}>
                    +
                  </button>
                </div>
              ) : (
                <div className="new-category-form">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Nome da categoria..."
                    value={newCatName} 
                    onChange={e => { setNewCatName(e.target.value); setCatError(''); }}
                    autoFocus
                    style={{ marginBottom: 8 }}
                  />
                  
                  {/* Icon Picker */}
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Ícone</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {CATEGORY_ICONS.map(icon => (
                        <button key={icon} type="button"
                          style={{
                            fontSize: 16, padding: '4px 6px', borderRadius: 6, border: 'none',
                            background: newCatIcon === icon ? 'var(--gradient-primary)' : 'var(--bg-glass)',
                            cursor: 'pointer', transition: 'var(--transition-fast)',
                            minWidth: 30, minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          onClick={() => setNewCatIcon(icon)}>
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Cor</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {CATEGORY_COLORS.map(color => (
                        <button key={color} type="button"
                          style={{
                            width: 24, height: 24, borderRadius: '50%', border: newCatColor === color ? '2px solid white' : '2px solid transparent',
                            background: color, cursor: 'pointer', transition: 'var(--transition-fast)',
                            boxShadow: newCatColor === color ? `0 0 8px ${color}` : 'none',
                          }}
                          onClick={() => setNewCatColor(color)} />
                      ))}
                    </div>
                  </div>

                  {catError && (
                    <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 6 }}>{catError}</div>
                  )}

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn-secondary btn-sm" 
                      onClick={() => { setShowNewCategory(false); setCatError(''); }}
                      style={{ flex: 1 }}>
                      Cancelar
                    </button>
                    <button type="button" className="btn-green btn-sm" 
                      onClick={handleCreateCategory}
                      disabled={creatingCat}
                      style={{ flex: 1 }}>
                      {creatingCat ? '...' : '✓ Criar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={form.status}
                onChange={e => update('status', e.target.value)}>
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mês referência */}
          <div className="form-group">
            <label>Mês de Referência</label>
            <input type="month" className="form-input" value={form.month}
              onChange={e => update('month', e.target.value)} />
          </div>

          {/* Installments */}
          {form.type === 'saida' && (
            <div className="form-row">
              <div className="form-group">
                <label>Parcela Atual (opcional)</label>
                <input type="number" className="form-input" placeholder="Ex: 2"
                  value={form.installmentCurrent} onChange={e => update('installmentCurrent', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Total de Parcelas</label>
                <input type="number" className="form-input" placeholder="Ex: 12"
                  value={form.installmentTotal} onChange={e => update('installmentTotal', e.target.value)} />
              </div>
            </div>
          )}

          {/* Recurring */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="recurring" checked={form.isRecurring}
              onChange={e => update('isRecurring', e.target.checked)} />
            <label htmlFor="recurring" style={{ margin: 0 }}>Conta recorrente (gerar automaticamente todo mês)</label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
