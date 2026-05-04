'use client';

import { useState, useEffect } from 'react';
import CurrencyInput, { centsToReais } from './CurrencyInput';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DepositFormData) => Promise<void>;
  goals: { id: string; title: string; icon: string }[];
  preselectedGoalId?: string;
  wallets: { id: string; name: string; balance: number; color: string }[];
}

export interface DepositFormData {
  goalId: string;
  amount: string;
  depositDate: string;
  source: string;
  note: string;
  walletId?: string;
}

const SOURCES = ['Poupança', 'Conta Corrente', 'Freelance', 'Salário', 'Outro'];

export default function DepositModal({ isOpen, onClose, onSave, goals, preselectedGoalId, wallets }: DepositModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<DepositFormData>({
    goalId: preselectedGoalId || goals[0]?.id || '',
    amount: '0',
    depositDate: today,
    source: 'Poupança',
    note: '',
    walletId: '',
  });
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        goalId: preselectedGoalId || goals[0]?.id || '',
        amount: '0',
        depositDate: today,
        source: 'Poupança',
        note: '',
        walletId: '',
      });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountInReais = centsToReais(form.amount);
    if (amountInReais <= 0) return;
    
    setSaving(true);
    await onSave({ ...form, amount: amountInReais.toFixed(2) });
    setSaving(false);
    onClose();
  };

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">💰 Novo Aporte</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Objetivo</label>
            <select className="form-select" value={form.goalId} onChange={e => update('goalId', e.target.value)}>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.icon} {g.title}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Valor (R$)</label>
              <CurrencyInput
                value={form.amount}
                onChange={(rawCents) => update('amount', rawCents)}
                required
              />
            </div>
            <div className="form-group">
              <label>Data</label>
              <input type="date" className="form-input" value={form.depositDate}
                onChange={e => update('depositDate', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>Abater de qual carteira?</label>
            <div className="wallet-selector-grid">
              {wallets.map(w => (
                <div key={w.id} 
                  className={`wallet-option ${form.walletId === w.id ? 'active' : ''}`}
                  onClick={() => update('walletId', w.id)}
                >
                  <span className="wallet-option-name">{w.name}</span>
                  <span className="wallet-option-balance">{w.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Observação (opcional)</label>
            <input type="text" className="form-input" placeholder="Ex: Economizei do freelance"
              value={form.note} onChange={e => update('note', e.target.value)} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Depositando...' : '💰 Depositar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
