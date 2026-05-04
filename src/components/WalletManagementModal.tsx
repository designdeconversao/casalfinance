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
  onTransfer?: (fromId: string, toId: string, amount: number, note: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316',
  '#f59e0b','#22c55e','#10b981','#14b8a6','#3b82f6',
  '#0ea5e9','#64748b',
];

type View = 'list' | 'add' | 'edit' | 'deposit' | 'transfer';

export default function WalletManagementModal({
  isOpen, onClose, wallets, onAdd, onDelete, onEdit, onDeposit, onTransfer,
}: WalletManagementModalProps) {
  const [view, setView]   = useState<View>('list');
  const [selected, setSelected] = useState<Wallet | null>(null);

  // form state
  const [name, setName]           = useState('');
  const [balanceCents, setBalanceCents] = useState('0');
  const [isJoint, setIsJoint]     = useState(false);
  const [color, setColor]         = useState('#6366f1');
  const [depositCents, setDepositCents] = useState('0');
  const [depositNote, setDepositNote]   = useState('');
  const [destWalletId, setDestWalletId] = useState('');
  const [transferCents, setTransferCents] = useState('0');
  const [transferNote, setTransferNote]   = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  const reset = () => {
    setName(''); setBalanceCents('0'); setIsJoint(false); setColor('#6366f1');
    setDepositCents('0'); setDepositNote('');
    setTransferCents('0'); setTransferNote(''); setDestWalletId('');
  };

  const openAdd = () => { reset(); setView('add'); };

  const openEdit = (w: Wallet) => {
    setSelected(w); setName(w.name); setColor(w.color || '#6366f1'); setIsJoint(w.isJoint);
    setView('edit');
  };

  const openDeposit = (w: Wallet) => {
    setSelected(w); setDepositCents('0'); setDepositNote(''); setView('deposit');
  };

  const openTransfer = (w: Wallet) => {
    setSelected(w); setTransferCents('0'); setTransferNote('');
    setDestWalletId(wallets.find(x => x.id !== w.id)?.id || '');
    setView('transfer');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await onAdd({ name, balance: centsToReais(balanceCents), isJoint, color });
    setSaving(false); reset(); setView('list');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !onEdit) return;
    setSaving(true);
    await onEdit(selected.id, { name, color, isJoint });
    setSaving(false); setView('list');
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !onDeposit) return;
    const amount = centsToReais(depositCents);
    if (amount === 0) { alert('Informe um valor'); return; }
    setSaving(true);
    await onDeposit(selected.id, amount, depositNote);
    setSaving(false); setView('list');
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const amount = centsToReais(transferCents);
    if (amount <= 0)  { alert('Informe um valor positivo'); return; }
    if (!destWalletId){ alert('Selecione a carteira de destino'); return; }
    if (destWalletId === selected.id) { alert('Origem e destino não podem ser iguais'); return; }
    setSaving(true);
    if (onTransfer) {
      await onTransfer(selected.id, destWalletId, amount, transferNote);
    } else if (onDeposit) {
      // fallback: two balance adjusts
      await onDeposit(selected.id,   -amount, `Transferência para ${wallets.find(w => w.id === destWalletId)?.name}`);
      await onDeposit(destWalletId,   amount, `Transferência de ${selected.name}`);
    }
    setSaving(false); setView('list');
  };

  const ColorPicker = () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
      {PRESET_COLORS.map(c => (
        <button key={c} type="button" onClick={() => setColor(c)} style={{
          width: 32, height: 32, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
          outline: color === c ? '3px solid white' : 'none',
          boxShadow: color === c ? `0 0 0 4px ${c}55` : 'none',
          transform: color === c ? 'scale(1.15)' : 'scale(1)',
          transition: 'all 0.15s',
        }} />
      ))}
      <input type="color" value={color} onChange={e => setColor(e.target.value)}
        style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }}
        title="Cor personalizada" />
    </div>
  );

  const BackBtn = () => (
    <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancelar</button>
  );

  const titleMap: Record<View, string> = {
    list: '💳 Minhas Contas',
    add: '➕ Nova Conta',
    edit: '✏️ Editar Conta',
    deposit: '💰 Aporte / Ajuste',
    transfer: '🔄 Transferir entre Contas',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{titleMap[view]}</h2>
          <button className="modal-close" onClick={() => view === 'list' ? onClose() : setView('list')}>
            {view === 'list' ? '✕' : '←'}
          </button>
        </div>

        {/* ── LIST ── */}
        {view === 'list' && (
          <>
            <div style={{
              background: 'var(--gradient-primary)', borderRadius: 'var(--border-radius-sm)',
              padding: '16px 20px', marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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
                    background: 'var(--bg-glass)', borderRadius: 'var(--border-radius-sm)',
                    border: `1px solid var(--border-glass)`, borderLeft: `4px solid ${w.color || '#6366f1'}`,
                    padding: '14px 16px',
                  }}>
                    {/* Info row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                          {w.name}
                          {w.isJoint && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--purple)', background: 'var(--purple-bg)', padding: '2px 6px', borderRadius: 4 }}>Conjunta</span>}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2, color: w.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {fmt(w.balance)}
                        </div>
                      </div>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: w.color || '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                      }}>
                        {w.isJoint ? '💑' : '👤'}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openDeposit(w)} title="Aporte/Ajuste" style={{
                        flex: 1, background: 'rgba(34,197,94,0.1)', color: 'var(--green)',
                        border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8,
                        padding: '6px 0', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}>💰 Aporte</button>
                      <button onClick={() => openTransfer(w)} title="Transferir" disabled={wallets.length < 2} style={{
                        flex: 1, background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                        border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8,
                        padding: '6px 0', cursor: wallets.length < 2 ? 'not-allowed' : 'pointer',
                        fontSize: 12, fontWeight: 600, opacity: wallets.length < 2 ? 0.4 : 1,
                      }}>🔄 Transferir</button>
                      <button onClick={() => openEdit(w)} title="Editar" style={{
                        flex: 1, background: 'var(--purple-bg)', color: 'var(--purple)',
                        border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8,
                        padding: '6px 0', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}>✏️ Editar</button>
                      <button onClick={() => {
                        if (window.confirm(`Excluir a conta "${w.name}"? O saldo será perdido.`)) onDelete(w.id);
                      }} title="Excluir" style={{
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
                        padding: '6px 10px', cursor: 'pointer', fontSize: 14,
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

        {/* ── ADD ── */}
        {view === 'add' && (
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Nome da Conta</label>
              <input className="form-input" placeholder="Ex: Nubank, Inter, Caixa..."
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Saldo Inicial (R$)</label>
              <CurrencyInput value={balanceCents} onChange={setBalanceCents} />
            </div>
            <div className="form-group">
              <label>Cor de Identificação</label>
              <ColorPicker />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={isJoint} onChange={e => setIsJoint(e.target.checked)} />
              <span style={{ fontSize: 14 }}>Esta é uma conta conjunta 💑</span>
            </label>
            <div className="modal-actions">
              <BackBtn />
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : '💾 Salvar Conta'}
              </button>
            </div>
          </form>
        )}

        {/* ── EDIT ── */}
        {view === 'edit' && selected && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Nome da Conta</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Cor de Identificação</label>
              <ColorPicker />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={isJoint} onChange={e => setIsJoint(e.target.checked)} />
              <span style={{ fontSize: 14 }}>Conta conjunta 💑</span>
            </label>
            <div className="modal-actions">
              <BackBtn />
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : '💾 Salvar Alterações'}
              </button>
            </div>
          </form>
        )}

        {/* ── DEPOSIT / ADJUST ── */}
        {view === 'deposit' && selected && (
          <form onSubmit={handleDeposit}>
            {/* Current balance preview */}
            <div style={{
              background: 'var(--bg-glass)', borderRadius: 10, padding: '14px 16px',
              marginBottom: 20, border: '1px solid var(--border-glass)', borderLeft: `4px solid ${selected.color}`,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saldo atual — {selected.name}</div>
              <div style={{ fontWeight: 700, fontSize: 22, color: selected.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {fmt(selected.balance)}
              </div>
            </div>

            <div className="form-group">
              <label>Valor do Aporte (R$)</label>
              <CurrencyInput value={depositCents} onChange={setDepositCents} placeholder="R$ 0,00" />
              <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                💡 Use valores negativos para reduzir o saldo (ex: ajuste de lançamento)
              </small>
            </div>
            <div className="form-group">
              <label>Observação (opcional)</label>
              <input className="form-input" placeholder="Ex: Salário de Maio, Correção de saldo..."
                value={depositNote} onChange={e => setDepositNote(e.target.value)} />
            </div>
            <div className="modal-actions">
              <BackBtn />
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : '💰 Confirmar'}
              </button>
            </div>
          </form>
        )}

        {/* ── TRANSFER ── */}
        {view === 'transfer' && selected && (
          <form onSubmit={handleTransfer}>
            {/* From → To */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                background: `${selected.color}18`, border: `1px solid ${selected.color}44`,
                borderRadius: 10, padding: '10px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Saindo de</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 2 }}>{fmt(selected.balance)}</div>
              </div>
              <span style={{ fontSize: 20, textAlign: 'center' }}>→</span>
              <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Destino</div>
                <select className="form-input"
                  style={{ marginBottom: 0, padding: '4px 8px', fontSize: 13 }}
                  value={destWalletId} onChange={e => setDestWalletId(e.target.value)} required>
                  {wallets.filter(w => w.id !== selected.id).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Valor a Transferir (R$)</label>
              <CurrencyInput value={transferCents} onChange={setTransferCents} placeholder="R$ 0,00" />
            </div>
            <div className="form-group">
              <label>Observação (opcional)</label>
              <input className="form-input" placeholder="Ex: Pagamento conjunto, Reserva de emergência..."
                value={transferNote} onChange={e => setTransferNote(e.target.value)} />
            </div>
            <div className="modal-actions">
              <BackBtn />
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Transferindo...' : '🔄 Confirmar Transferência'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
