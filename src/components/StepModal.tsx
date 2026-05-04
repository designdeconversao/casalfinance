'use client';

import { useState, useEffect } from 'react';
import CurrencyInput, { centsToReais } from './CurrencyInput';

interface StepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StepFormData) => Promise<void>;
  goalId: string;
  goalTitle: string;
}

export interface StepFormData {
  goalId: string;
  title: string;
  estimatedAmount: string;
  deadline: string;
  note: string;
}

export default function StepModal({ isOpen, onClose, onSave, goalId, goalTitle }: StepModalProps) {
  const [form, setForm] = useState<StepFormData>({
    goalId,
    title: '',
    estimatedAmount: '0',
    deadline: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ goalId, title: '', estimatedAmount: '0', deadline: '', note: '' });
    }
  }, [isOpen, goalId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const amountInReais = centsToReais(form.estimatedAmount);
    await onSave({ ...form, estimatedAmount: amountInReais.toFixed(2) });
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
          <h2 className="modal-title">📋 Nova Etapa</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Para o objetivo: <strong style={{ color: 'var(--text-primary)' }}>{goalTitle}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título da Etapa</label>
            <input type="text" className="form-input" placeholder="Ex: Reservar hotel, Comprar passagens..."
              value={form.title} onChange={e => update('title', e.target.value)} required autoFocus />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Valor Estimado (R$)</label>
              <CurrencyInput
                value={form.estimatedAmount}
                onChange={(rawCents) => update('estimatedAmount', rawCents)}
              />
            </div>
            <div className="form-group">
              <label>Prazo</label>
              <input type="date" className="form-input" value={form.deadline}
                onChange={e => update('deadline', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Observação (opcional)</label>
            <input type="text" className="form-input" placeholder="Ex: Confirmar disponibilidade antes"
              value={form.note} onChange={e => update('note', e.target.value)} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : '📋 Criar Etapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
