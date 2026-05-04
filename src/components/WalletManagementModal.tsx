import React, { useState } from 'react';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  isJoint: boolean;
  color: string;
}

interface WalletManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function WalletManagementModal({
  isOpen,
  onClose,
  wallets,
  onAdd,
  onDelete
}: WalletManagementModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState(0);
  const [isJoint, setIsJoint] = useState(false);
  const [color, setColor] = useState('#8b5cf6');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd({ name, balance, isJoint, color });
    setIsAdding(false);
    setName('');
    setBalance(0);
    setIsJoint(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Minhas Contas</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {!isAdding ? (
          <>
            <div className="wallets-list" style={{ marginBottom: 20 }}>
              {wallets.map(w => (
                <div key={w.id} className="transaction-item" style={{ gridTemplateColumns: '1fr auto auto' }}>
                  <div className="transaction-desc">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: w.color, marginRight: 8 }} />
                    <div>
                      <div className="transaction-name">{w.name} {w.isJoint ? '💑' : ''}</div>
                    </div>
                  </div>
                  <span className="transaction-amount">{formatCurrency(w.balance)}</span>
                  <div className="transaction-actions">
                    <button className="delete" onClick={() => onDelete(w.id)} title="Excluir Conta">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setIsAdding(true)}>
              ➕ Adicionar Nova Conta
            </button>
          </>
        ) : (
          <form onSubmit={handleAdd}>
            <div className="input-group">
              <label className="input-label">Nome da Conta (ex: Nubank, Itaú...)</label>
              <input 
                className="input-field" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Saldo Inicial</label>
              <input 
                type="number" 
                step="0.01" 
                className="input-field" 
                value={balance} 
                onChange={e => setBalance(parseFloat(e.target.value))} 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Cor de Identificação</label>
              <input 
                type="color" 
                className="input-field" 
                style={{ height: 44, padding: 4 }}
                value={color} 
                onChange={e => setColor(e.target.value)} 
              />
            </div>
            <div className="input-group">
              <label className="switch-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isJoint} 
                  onChange={e => setIsJoint(e.target.checked)} 
                />
                <span>Esta é uma conta conjunta? 💑</span>
              </label>
            </div>
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">Salvar Conta</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
