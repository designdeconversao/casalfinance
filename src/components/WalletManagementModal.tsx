'use client';
import React, { useState } from 'react';
import CurrencyInput, { centsToReais } from './CurrencyInput';

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
  onEdit?: (id: string, data: any) => Promise<void>;
  onDeposit?: (id: string, amount: number, note: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#22c55e', '#10b981', '#14b8a6', '#3b82f6',
  '#0ea5e9', '#64748b',
];

type View = 'list' | 'add' | 'edit' | 'deposit';

export default function WalletManagementModal({
  isOpen, onClose, wallets, onAdd, onDelete, onEdit, onDeposit
}: WalletManagementModalProps) {
  const [view, setView] = useState<View>('list');
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [balanceCents, setBalanceCents] = useState('0');
  const [isJoint, setIsJoint] = useState(false);
  const [color, setColor] = useState('#6366f1');
  const [depositCents, setDepositCents] = useState('0');
  const [depositNote, setDepositNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const fmt = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const resetForm = () => {
    setName(''); setBalanceCents('0'); setIsJoint(false); setColor('#6366f1');
    setDepositCents('0'); setDepositNote('');
  };

  const openAdd = () => { resetForm(); setView('add'); };

  const openEdit = (w: Wallet) => {
    setSelectedWallet(w);
    setName(w.name);
    setColor(w.color || '#6366f1');
    setIsJoint(w.isJoint);
    setView('edit');
  };

  const openDeposit = (w: Wallet) => {
    setSelectedWallet(w);
    setDepositCents('0');
    setDepositNote('');
    setView('deposit');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onAdd({ name, balance: centsToReais(balanceCents), isJoint, color });
    setSaving(false);
    resetForm();
    setView('list');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet || !onEdit) return;
    setSaving(true);
    await onEdit(selectedWallet.id, { name, color, isJoint });
    setSaving(false);
    setView('list');
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet || !onDeposit) return;
    const amount = centsToReais(depositCents);
    if (amount === 0) { alert('Informe um valor'); return; }
    setSaving(true);
    await onDeposit(selectedWallet.id, amount, depositNote);
    setSaving(false);
    setView('list');
  };

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {view === 'list' && '💳 Minhas Contas'}
            {view === 'add' && '➕ Nova Conta'}
            {view === 'edit' && '✏️ Editar Conta'}
            {view === 'deposit' && '💰 Ajustar Saldo'}
          </h2>
          <button className="modal-close" onClick={() => view === 'list' ? onClose() : setView('list')}>
            {view === 'list' ? '✕' : '←'}
          </button>
        </div>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <>
            {/* Total */}
            <div style={{
              background: 'var(--gradient-primary)', borderRadius: 'var(--border-radius-sm)',
              padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Saldo Total</span>
              <span style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{fmt(totalBalance)}</span>
            </div>

            {wallets.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-state-icon">💳</div>
                <div className="empty-state-text">Nenhuma conta cadastrada</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {wallets.map(w => (
                  <div key={w.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto',
                    gap: 12, padding: '14px 16px',
                    background: 'var(--bg-glass)', borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-glass)',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: w.color || '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, flexShrink: 0,
                      }}>
                        {w.isJoint ? '💑' : '👤'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                          {w.name}
                          {w.isJoint && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--purple)', background: 'var(--purple-bg)', padding: '2px 6px', borderRadius: 4 }}>Conjunta</span>}
                        </div>
                        <div style={{
                          fontWeight: 700, fontSize: 16, marginTop: 2,
                          color: w.balance >= 0 ? 'var(--green)' : 'var(--red)'
                        }}>
                          {fmt(w.balance)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="Ajustar Saldo" onClick={() => openDeposit(w)} style={{
                        background: 'var(--green-bg)', color: 'var(--green)', border: 'none',
                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14
                      }}>💰</button>
                      <button title="Editar" onClick={() => openEdit(w)} style={{
                        background: 'var(--purple-bg)', color: 'var(--purple)', border: 'none',
                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14
                      }}>✏️</button>
                      <button title="Excluir" onClick={() => {
                        if (window.confirm(`Excluir a conta "${w.name}"? O saldo será perdido.`)) onDelete(w.id);
                      }} style={{
                        background: 'var(--red-bg, rgba(239,68,68,0.1))', color: 'var(--red)', border: 'none',
                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14
                      }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-primary" style={{ width: '100%' }} onClick={openAdd}>
              ➕ Adicionar Nova Conta
            </button>
          </>
        )}

        {/* ── ADD VIEW ── */}
        {view === 'add' && (
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Nome da Conta</label>
              <input className="form-input" placeholder="Ex: Nubank, Inter, Caixa..." value={name}
                onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Saldo Inicial (R$)</label>
              <CurrencyInput value={balanceCents} onChange={setBalanceCents} />
            </div>
            <div className="form-group">
              <label>Cor de Identificação</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)} style={{
                    width: 32, height: 32, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? '3px solid white' : 'none',
                    boxShadow: color === c ? `0 0 0 4px ${c}55` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }} />
                ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2
                }} title="Cor personalizada" />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={isJoint} onChange={e => setIsJoint(e.target.checked)} />
              <span style={{ fontSize: 14 }}>Esta é uma conta conjunta 💑</span>
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : '💾 Salvar Conta'}
              </button>
            </div>
          </form>
        )}

        {/* ── EDIT VIEW ── */}
        {view === 'edit' && selectedWallet && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Nome da Conta</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Cor de Identificação</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)} style={{
                    width: 32, height: 32, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? '3px solid white' : 'none',
                    boxShadow: color === c ? `0 0 0 4px ${c}55` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }} />
                ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2
                }} title="Cor personalizada" />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={isJoint} onChange={e => setIsJoint(e.target.checked)} />
              <span style={{ fontSize: 14 }}>Conta conjunta 💑</span>
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : '💾 Salvar Alterações'}
              </button>
            </div>
          </form>
        )}

        {/* ── DEPOSIT / ADJUST VIEW ── */}
        {view === 'deposit' && selectedWallet && (
          <form onSubmit={handleDeposit}>
            <div style={{
              background: 'var(--bg-glass)', borderRadius: 'var(--border-radius-sm)',
              padding: '12px 16px', marginBottom: 20, border: '1px solid var(--border-glass)'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saldo atual de</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedWallet.name}</div>
              <div style={{ fontWeight: 700, fontSize: 22, color: selectedWallet.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {fmt(selectedWallet.balance)}
              </div>
            </div>
            <div className="form-group">
              <label>Valor do Aporte / Ajuste (R$)</label>
              <CurrencyInput value={depositCents} onChange={setDepositCents} />
              <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Use valor negativo para reduzir o saldo. O novo saldo será somado ao atual.
              </small>
            </div>
            <div className="form-group">
              <label>Observação (opcional)</label>
              <input className="form-input" placeholder="Ex: Salário de Maio" value={depositNote}
                onChange={e => setDepositNote(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : '💰 Confirmar Aporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
