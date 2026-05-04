'use client';
import React, { useState, useMemo } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (data: { name: string; icon: string; color: string }) => Promise<void>;
  onEdit: (id: string, data: { name: string; icon: string; color: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// Curated emoji set organized by category (WhatsApp-style)
const EMOJI_GROUPS = [
  {
    label: 'Finanças',
    emojis: ['💰', '💵', '💳', '🏦', '📈', '📉', '💹', '🪙', '💎', '🏆', '💸', '🤑'],
  },
  {
    label: 'Casa',
    emojis: ['🏠', '🏡', '🏢', '🏗️', '🔑', '🛋️', '🛏️', '🚿', '💡', '🔧', '🪣', '🧹'],
  },
  {
    label: 'Alimentação',
    emojis: ['🍽️', '🥘', '🍕', '🍔', '🥗', '🥩', '🍞', '🛒', '☕', '🍺', '🍰', '🌮'],
  },
  {
    label: 'Transporte',
    emojis: ['🚗', '🚙', '🏍️', '✈️', '🚌', '🚆', '⛽', '🅿️', '🛵', '🚢', '🚁', '🛻'],
  },
  {
    label: 'Saúde',
    emojis: ['🏥', '💊', '🩺', '🩻', '💉', '🏋️', '🧘', '🦷', '👓', '🩹', '🧬', '❤️‍🩹'],
  },
  {
    label: 'Educação',
    emojis: ['📚', '🎓', '✏️', '📝', '🖥️', '📐', '🔬', '🏫', '📖', '🧑‍💻', '📓', '🎒'],
  },
  {
    label: 'Lazer',
    emojis: ['🎉', '🎮', '🎬', '🎵', '⚽', '🏖️', '🎭', '🎸', '🏄', '🎲', '🎯', '🎪'],
  },
  {
    label: 'Compras',
    emojis: ['👕', '👟', '👗', '💄', '👜', '💍', '🕶️', '👒', '🧴', '🛍️', '🧣', '⌚'],
  },
  {
    label: 'Serviços',
    emojis: ['📺', '📱', '💻', '📡', '🔒', '📄', '⚙️', '🛠️', '📦', '🔌', '🌐', '📨'],
  },
  {
    label: 'Família',
    emojis: ['👨‍👩‍👧', '🐾', '🎁', '🎂', '👶', '🐕', '🐈', '🌹', '💑', '🏠', '👵', '👴'],
  },
  {
    label: 'Outros',
    emojis: ['📌', '📊', '🗓️', '⭐', '🌟', '🔖', '🏷️', '📂', '🗃️', '🔔', '💬', '❓'],
  },
];

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#22c55e', '#10b981', '#14b8a6', '#3b82f6',
  '#0ea5e9', '#d946ef', '#a3e635', '#64748b',
];

type View = 'list' | 'add' | 'edit';

export default function CategoryManagementModal({
  isOpen, onClose, categories, onAdd, onEdit, onDelete
}: CategoryManagementModalProps) {
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredEmojis = useMemo(() => {
    if (!emojiSearch) return EMOJI_GROUPS;
    const q = emojiSearch.toLowerCase();
    return EMOJI_GROUPS.map(g => ({
      ...g,
      emojis: g.emojis.filter(e => g.label.toLowerCase().includes(q)),
    })).filter(g => g.label.toLowerCase().includes(q) || g.emojis.length > 0);
  }, [emojiSearch]);

  const filteredCategories = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const openAdd = () => {
    setName(''); setIcon('📌'); setColor('#6366f1'); setView('add');
  };
  const openEdit = (c: Category) => {
    setSelected(c); setName(c.name); setIcon(c.icon); setColor(c.color || '#6366f1'); setView('edit');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({ name: name.trim(), icon, color });
    setSaving(false);
    setView('list');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    await onEdit(selected.id, { name: name.trim(), icon, color });
    setSaving(false);
    setView('list');
  };

  const handleDelete = (c: Category) => {
    if (window.confirm(`Excluir a categoria "${c.name}"?`)) {
      onDelete(c.id);
    }
  };

  const EmojiPicker = () => (
    <div style={{
      border: '1px solid var(--border-glass)', borderRadius: 'var(--border-radius-sm)',
      background: 'var(--bg-secondary)', overflow: 'hidden', marginTop: 8,
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-glass)' }}>
        <input
          className="form-input"
          placeholder="🔍 Buscar emoji..."
          value={emojiSearch}
          onChange={e => setEmojiSearch(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto', padding: 12 }}>
        {filteredEmojis.map(group => (
          <div key={group.label} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {group.emojis.map(e => (
                <button key={e} type="button" onClick={() => setIcon(e)} style={{
                  width: 36, height: 36, fontSize: 20, borderRadius: 8, border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: icon === e ? 'var(--purple-bg)' : 'transparent',
                  outline: icon === e ? '2px solid var(--purple)' : 'none',
                  transition: 'all 0.1s ease',
                }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CategoryForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Nome da Categoria</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Mercado" />
      </div>
      <div className="form-group">
        <label>Ícone Selecionado</label>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: `${color}22`, borderRadius: 10, border: `2px solid ${color}44`, marginBottom: 8,
        }}>
          <span style={{ fontSize: 32 }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name || 'Nome da categoria'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prévia da categoria</div>
          </div>
        </div>
        <EmojiPicker />
      </div>
      <div className="form-group">
        <label>Cor</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {PRESET_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} style={{
              width: 30, height: 30, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
              outline: color === c ? '3px solid white' : 'none',
              boxShadow: color === c ? `0 0 0 4px ${c}55` : 'none',
              transform: color === c ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2,
          }} />
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : '💾 Salvar'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {view === 'list' && '🗂️ Categorias'}
            {view === 'add' && '➕ Nova Categoria'}
            {view === 'edit' && '✏️ Editar Categoria'}
          </h2>
          <button className="modal-close" onClick={() => view === 'list' ? onClose() : setView('list')}>
            {view === 'list' ? '✕' : '←'}
          </button>
        </div>

        {view === 'list' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <input
                className="form-input"
                placeholder="🔍 Buscar categoria..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{
              maxHeight: 380, overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 8,
              marginBottom: 16,
            }}>
              {filteredCategories.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-state-icon">🗂️</div>
                  <div className="empty-state-text">Nenhuma categoria encontrada</div>
                </div>
              ) : filteredCategories.map(c => (
                <div key={c.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  gap: 8, padding: '10px 14px',
                  background: 'var(--bg-glass)', borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-glass)',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: `${c.color || '#6366f1'}22`,
                      border: `2px solid ${c.color || '#6366f1'}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}>
                      {c.icon}
                    </div>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(c)} title="Editar" style={{
                      background: 'var(--purple-bg)', color: 'var(--purple)', border: 'none',
                      borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13
                    }}>✏️</button>
                    <button onClick={() => handleDelete(c)} title="Excluir" style={{
                      background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none',
                      borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13
                    }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={openAdd}>
              ➕ Adicionar Categoria
            </button>
          </>
        )}

        {view === 'add' && <CategoryForm onSubmit={handleAdd} />}
        {view === 'edit' && <CategoryForm onSubmit={handleEdit} />}
      </div>
    </div>
  );
}
