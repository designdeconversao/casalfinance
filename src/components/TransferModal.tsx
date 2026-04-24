'use client';

import { useState, useEffect } from 'react';
import CurrencyInput, { centsToReais } from './CurrencyInput';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  wallets: { id: string; name: string; balance: number; color: string }[];
}

export default function TransferModal({ isOpen, onClose, onSave, wallets }: TransferModalProps) {
  const [form, setForm] = useState({
    fromWalletId: '',
    toWalletId: '',
    amount: '0',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        fromWalletId: wallets[0]?.id || '',
        toWalletId: wallets[1]?.id || '',
        amount: '0',
        date: new Date().toISOString().slice(0, 10),
        description: '',
      });
    }
  }, [isOpen, wallets]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fromWalletId === form.toWalletId) {
      alert('Selecione carteiras diferentes para a transferência');
      return;
    }
    const val = centsToReais(form.amount);
    if (val <= 0) return;

    setSaving(true);
    await onSave({ ...form, amount: val.toFixed(2) });
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
          <h2 className="modal-title">🔄 Transferência entre Carteiras</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Origem (De onde sai o dinheiro?)</label>
            <select className="form-select" value={form.fromWalletId} onChange={e => update('fromWalletId', e.target.value)}>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name} (Saldo: {w.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Destino (Para onde vai o dinheiro?)</label>
            <select className="form-select" value={form.toWalletId} onChange={e => update('toWalletId', e.target.value)}>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Valor (R$)</label>
              <CurrencyInput value={form.amount} onChange={val => update('amount', val)} required />
            </div>
            <div className="form-group">
              <label>Data</label>
              <input type="date" className="form-input" value={form.date} onChange={e => update('date', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>Descrição (opcional)</label>
            <input type="text" className="form-input" placeholder="Ex: Pix para Mari, Reserva..."
              value={form.description} onChange={e => update('description', e.target.value)} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Transferindo...' : '🔄 Confirmar Transferência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
