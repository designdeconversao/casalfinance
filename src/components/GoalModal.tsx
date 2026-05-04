'use client';

import { useState, useEffect } from 'react';
import CurrencyInput, { centsToReais } from './CurrencyInput';

const GOAL_ICONS = ['🏖️', '🛋️', '🚗', '💍', '🎓', '📱', '🏠', '🎮', '✈️', '💻', '👶', '🎁', '🎯'];

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GoalFormData) => Promise<void>;
}

export interface GoalFormData {
  title: string;
  description: string;
  icon: string;
  scope: 'pessoal' | 'casal';
  calcType: 'fixed' | 'sum_of_steps';
  targetAmount: string;
  deadline: string;
}

export default function GoalModal({ isOpen, onClose, onSave }: GoalModalProps) {
  const [form, setForm] = useState<GoalFormData>({
    title: '',
    description: '',
    icon: '🎯',
    scope: 'casal',
    calcType: 'fixed',
    targetAmount: '0',
    deadline: '',
  });
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        title: '',
        description: '',
        icon: '🎯',
        scope: 'casal',
        calcType: 'fixed',
        targetAmount: '0',
        deadline: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      alert("Por favor, preencha o título do objetivo.");
      return;
    }
    if (!form.deadline) {
      alert("Por favor, preencha o prazo limite do objetivo.");
      return;
    }

    const amountInReais = form.calcType === 'fixed' ? centsToReais(form.targetAmount) : 0;
    if (form.calcType === 'fixed' && amountInReais <= 0) {
      alert("O valor da meta deve ser maior que zero para metas fixas.");
      return;
    }
    
    setSaving(true);
    await onSave({ ...form, targetAmount: amountInReais.toFixed(2) });
    setSaving(false);
    onClose();
  };

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Calculate suggestion
  const getSuggestion = () => {
    if (form.calcType === 'sum_of_steps') return null;
    const target = centsToReais(form.targetAmount);
    if (!target || target <= 0 || !form.deadline) return null;
    const deadline = new Date(form.deadline);
    const today = new Date();
    const diffMs = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return null;
    const months = diffDays / 30;
    const weeks = diffDays / 7;
    const perMonth = target / months;
    const perWeek = target / weeks;
    return { perMonth: perMonth.toFixed(0), perWeek: perWeek.toFixed(0), days: diffDays };
  };

  const suggestion = getSuggestion();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🎯 Novo Objetivo</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título</label>
            <input type="text" className="form-input" placeholder="Ex: Viagem para a Praia"
              value={form.title} onChange={e => update('title', e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Descrição (opcional)</label>
            <input type="text" className="form-input" placeholder="Ex: 5 dias em Ubatuba"
              value={form.description} onChange={e => update('description', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Ícone</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GOAL_ICONS.map(icon => (
                <button key={icon} type="button"
                  style={{
                    fontSize: 24, padding: '8px 10px', borderRadius: 10, border: 'none',
                    background: form.icon === icon ? 'var(--gradient-primary)' : 'var(--bg-glass)',
                    cursor: 'pointer', transition: 'var(--transition)'
                  }}
                  onClick={() => update('icon', icon)}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Escopo</label>
              <div className="form-toggle-group">
                <button type="button" className={`form-toggle-btn ${form.scope === 'casal' ? 'active' : ''}`}
                  onClick={() => update('scope', 'casal')}>💑 Casal</button>
                <button type="button" className={`form-toggle-btn ${form.scope === 'pessoal' ? 'active' : ''}`}
                  onClick={() => update('scope', 'pessoal')}>👤 Pessoal</button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Como a meta será definida?</label>
            <div className="form-toggle-group" style={{ flexDirection: 'column', gap: '8px' }}>
              <button type="button" className={`form-toggle-btn ${form.calcType === 'fixed' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 16px' }}
                onClick={() => update('calcType', 'fixed')}>
                💰 Definir um valor fixo estimado
              </button>
              <button type="button" className={`form-toggle-btn ${form.calcType === 'sum_of_steps' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 16px' }}
                onClick={() => update('calcType', 'sum_of_steps')}>
                🗺️ Somatória das etapas (Calculado automaticamente)
              </button>
            </div>
          </div>

          <div className="form-row">
            {form.calcType === 'fixed' && (
              <div className="form-group">
                <label>💰 Meta (R$)</label>
                <CurrencyInput
                  value={form.targetAmount}
                  onChange={(rawCents) => update('targetAmount', rawCents)}
                />
              </div>
            )}
            <div className="form-group">
              <label>📅 Prazo</label>
              <input type="date" className="form-input" value={form.deadline}
                onChange={e => update('deadline', e.target.value)} required />
            </div>
          </div>

          {suggestion && (
            <div style={{
              padding: '16px', background: 'var(--purple-bg)', borderRadius: 'var(--border-radius-sm)',
              marginBottom: 16, border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 500, marginBottom: 6 }}>
                💡 Sugestão automática
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                Para atingir a meta em <strong>{suggestion.days} dias</strong>, {form.scope === 'casal' ? 'vocês precisam' : 'você precisa'} guardar
                <strong> ~R$ {suggestion.perMonth}/mês</strong> ou <strong>~R$ {suggestion.perWeek}/semana</strong>.
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Criando...' : '🎯 Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
