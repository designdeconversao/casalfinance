import React, { useState } from 'react';

interface GoalCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'purchase' | 'refund', walletId?: string) => void;
  goalTitle: string;
  amount: number;
  wallets: { id: string; name: string; balance: number }[];
}

export default function GoalCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  goalTitle,
  amount,
  wallets
}: GoalCompletionModalProps) {
  const [action, setAction] = useState<'purchase' | 'refund'>('purchase');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleConfirm = () => {
    if (action === 'refund' && !selectedWalletId) {
      alert('Selecione uma carteira para o estorno');
      return;
    }
    onConfirm(action, selectedWalletId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Finalizar Objetivo</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            Você atingiu ou decidiu encerrar o objetivo:
          </p>
          <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{goalTitle}</div>
            <div style={{ color: 'var(--purple)', fontSize: 24, fontWeight: 800 }}>{formatCurrency(amount)}</div>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">O que deseja fazer com o valor?</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div 
              className={`wallet-option ${action === 'purchase' ? 'active' : ''}`}
              onClick={() => setAction('purchase')}
              style={{ padding: '16px 10px' }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>🛍️</div>
              <div className="wallet-option-name">Efetuar Compra</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                Registra como gasto (já descontado)
              </div>
            </div>
            <div 
              className={`wallet-option ${action === 'refund' ? 'active' : ''}`}
              onClick={() => setAction('refund')}
              style={{ padding: '16px 10px' }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>💰</div>
              <div className="wallet-option-name">Estornar Valor</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                Devolve o dinheiro para uma conta
              </div>
            </div>
          </div>
        </div>

        {action === 'refund' && (
          <div className="input-group animate-fade-in">
            <label className="input-label">Destino do Estorno</label>
            <div className="wallet-selector-grid">
              {wallets.map(w => (
                <div 
                  key={w.id}
                  className={`wallet-option ${selectedWalletId === w.id ? 'active' : ''}`}
                  onClick={() => setSelectedWalletId(w.id)}
                >
                  <span className="wallet-option-name">{w.name}</span>
                  <span className="wallet-option-balance">{formatCurrency(w.balance)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleConfirm}>
            {action === 'purchase' ? 'Confirmar Compra' : 'Confirmar Estorno'}
          </button>
        </div>
      </div>
    </div>
  );
}
