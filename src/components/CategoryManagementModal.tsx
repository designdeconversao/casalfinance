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

// ─── Static data (outside component) ────────────────────────────────────────
const EMOJI_DATA: [string, string, ...string[]][] = [
  // Finanças
  ['💰','dinheiro','grana','financas','saldo'],
  ['💵','cedula','nota','real','dolar'],
  ['💳','cartao','credito','debito','banco'],
  ['🏦','banco','instituicao','financeiro'],
  ['📈','alta','grafico','investimento','crescimento'],
  ['📉','queda','grafico','prejuizo'],
  ['💹','bolsa','acoes','cambio'],
  ['🪙','moeda','coin','centavo'],
  ['💎','diamante','precioso','luxo'],
  ['🏆','premio','conquista','trofeu'],
  ['💸','gasto','dinheiro voando','despesa'],
  ['🤑','rico','dinheiro','ganho'],
  ['📊','relatorio','grafico','analise'],
  ['🔐','seguro','protecao','cofre'],
  ['🏧','caixa','atm','saque'],
  // Casa
  ['🏠','casa','lar','moradia','imovel'],
  ['🏡','casa','jardim','residencia'],
  ['🏢','predio','empresa','comercio','escritorio'],
  ['🔑','chave','acesso','aluguel'],
  ['🛋️','sofa','sala','movel','decoracao'],
  ['🛏️','cama','quarto','dormitorio'],
  ['🚿','banho','chuveiro','banheiro'],
  ['💡','luz','energia','eletricidade','lampada'],
  ['🔧','ferramenta','manutencao','reparo'],
  ['🪣','limpeza','balde','manutencao'],
  ['🧹','faxina','limpeza','varredor'],
  ['🪑','cadeira','movel','assento'],
  ['🖼️','quadro','decoracao','arte'],
  ['🛁','banheiro','banheira','chuveiro'],
  ['🪟','janela','cortina','persiana'],
  ['🚪','porta','entrada','acesso'],
  ['🏗️','construcao','obra','reforma'],
  ['🧰','ferramentas','caixa','reparo'],
  // Alimentação
  ['🍽️','refeicao','almoco','jantar','prato'],
  ['🥘','comida','prato','almoco'],
  ['🍕','pizza','lanche','fast food'],
  ['🍔','hamburguer','lanche','fast food'],
  ['🥗','salada','saudavel','dieta'],
  ['🥩','carne','churrasco','proteina'],
  ['🍞','pao','padaria','cafe'],
  ['🛒','mercado','supermercado','compras','feira'],
  ['☕','cafe','bebida','matinal'],
  ['🍺','cerveja','bebida','bar'],
  ['🍰','bolo','doce','sobremesa','aniversario'],
  ['🌮','taco','comida','mexicana'],
  ['🍜','macarrao','massa','jantar'],
  ['🍣','sushi','japones','peixe'],
  ['🥤','bebida','refrigerante','suco'],
  ['🍷','vinho','bebida','jantar'],
  ['🥚','ovo','cafe da manha','proteina'],
  ['🥦','verdura','legume','feira','mercado'],
  ['🍗','frango','proteina','almoco'],
  ['🫙','pote','mantimentos','despensa'],
  // Transporte
  ['🚗','carro','automovel','combustivel'],
  ['🚙','suv','carro','automovel'],
  ['🏍️','moto','motocicleta','combustivel'],
  ['✈️','aviao','viagem','passagem'],
  ['🚌','onibus','transporte','coletivo'],
  ['🚆','trem','metro','trilho'],
  ['⛽','combustivel','gasolina','abastecimento'],
  ['🅿️','estacionamento','vaga','parking'],
  ['🛵','scooter','moto','entrega'],
  ['🚢','navio','cruzeiro','viagem'],
  ['🚁','helicoptero','taxi aereo'],
  ['🛻','picape','carro','caminhonete'],
  ['🚕','taxi','uber','corrida'],
  ['🚲','bicicleta','bike','transporte'],
  ['🛴','patinete','mobilidade'],
  ['⚓','porto','navio','maritimo'],
  // Saúde
  ['🏥','hospital','saude','medico'],
  ['💊','remedio','medicamento','farmacia'],
  ['🩺','medico','consulta','clinica'],
  ['💉','vacina','injecao','exame'],
  ['🏋️','academia','musculacao','exercicio'],
  ['🧘','yoga','meditacao','bem estar'],
  ['🦷','dentista','odontologia','dentes'],
  ['👓','oculos','otica','visao'],
  ['🩹','curativo','ferimento','primeiros socorros'],
  ['🧬','genetica','exame','laboratorio'],
  ['🏃','corrida','exercicio','esporte'],
  ['🧴','farmacia','higiene','creme'],
  ['🩻','raio x','exame','diagnostico'],
  ['❤️','saude','coracao','bem estar'],
  ['😴','sono','descanso','bem estar'],
  // Educação
  ['📚','livros','estudo','educacao'],
  ['🎓','formatura','curso','faculdade'],
  ['✏️','escrita','estudo','escola'],
  ['📝','anotacao','tarefa','caderno'],
  ['🖥️','computador','informatica','tecnologia'],
  ['📐','geometria','matematica','escola'],
  ['🔬','ciencia','laboratorio','pesquisa'],
  ['🏫','escola','colegio','ensino'],
  ['📖','leitura','livro','aprendizado'],
  ['🧑‍💻','programador','tecnologia','informatica'],
  ['📓','caderno','anotacao','estudo'],
  ['🎒','mochila','escola','material'],
  ['🖊️','caneta','escrever','assinar'],
  ['📏','regua','geometria','escola'],
  ['📡','internet','satelite','tecnologia'],
  // Lazer
  ['🎉','festa','comemoracao','celebracao'],
  ['🎮','jogo','videogame','entretenimento'],
  ['🎬','cinema','filme','entretenimento'],
  ['🎵','musica','show','entretenimento'],
  ['⚽','futebol','esporte','jogo'],
  ['🏖️','praia','ferias','turismo'],
  ['🎭','teatro','cultura','arte'],
  ['🎸','violao','musica','banda'],
  ['🏄','surf','praia','esporte'],
  ['🎲','jogo de tabuleiro','entretenimento'],
  ['🎯','meta','jogo','precisao'],
  ['🎪','circo','show','entretenimento'],
  ['🎨','arte','pintura','criatividade'],
  ['📷','foto','camera','viagem'],
  ['🏕️','camping','natureza','ferias'],
  ['🎡','parque','diversao','lazer'],
  ['🏀','basquete','esporte','jogo'],
  ['🎾','tenis','esporte','raquete'],
  ['🎳','boliche','lazer','jogo'],
  ['🏊','natacao','piscina','esporte'],
  // Compras
  ['👕','roupa','vestuario','camisa'],
  ['👟','tenis','calcado','sapato'],
  ['👗','vestido','roupa','moda'],
  ['💄','maquiagem','beleza','cosmetico'],
  ['👜','bolsa','acessorio','moda'],
  ['💍','anel','joalheria','presente'],
  ['🕶️','oculos sol','acessorio','moda'],
  ['👒','chapeu','acessorio','moda'],
  ['🛍️','compras','sacola','shopping'],
  ['🧣','cachecol','acessorio','roupa'],
  ['⌚','relogio','acessorio','tempo'],
  ['👔','camisa social','roupa','trabalho'],
  ['🧥','casaco','roupa','frio'],
  ['👠','salto','calcado','moda'],
  ['💻','notebook','tecnologia','eletronico'],
  ['📱','celular','smartphone','eletronico'],
  ['🎧','fone','musica','eletronico'],
  ['📺','televisao','eletronico','entretenimento'],
  ['🖨️','impressora','escritorio','eletronico'],
  // Serviços / Assinaturas
  ['📡','streaming','internet','assinatura'],
  ['🔒','seguranca','protecao','seguro'],
  ['📄','documento','contrato','servico'],
  ['⚙️','configuracao','servico','manutencao'],
  ['🛠️','reparo','conserto','servico'],
  ['📦','entrega','encomenda','correios'],
  ['🔌','energia','eletricidade','instalacao'],
  ['🌐','internet','site','web'],
  ['📨','email','comunicacao','servico'],
  ['☁️','nuvem','cloud','armazenamento'],
  ['📲','app','servico digital','assinatura'],
  ['🔔','notificacao','alerta','aviso'],
  // Família / Pessoal
  ['👨‍👩‍👧','familia','casal','filho'],
  ['🐾','pet','animal','cachorro','gato'],
  ['🎁','presente','regalo','aniversario'],
  ['🎂','aniversario','bolo','comemoracao'],
  ['👶','bebe','filho','crianca'],
  ['🐕','cachorro','pet','animal'],
  ['🐈','gato','pet','animal'],
  ['🌹','flor','presente','romantico'],
  ['💑','casal','namorados','amor'],
  ['👵','idoso','mae','pai','familia'],
  ['🍼','bebe','mamadeira','filho'],
  ['🧒','crianca','filho','escola'],
  // Trabalho / Profissional
  ['💼','trabalho','profissional','escritorio'],
  ['📋','lista','tarefa','trabalho'],
  ['🗓️','agenda','calendario','compromisso'],
  ['📞','telefone','ligacao','contato'],
  ['🤝','parceria','negocio','acordo'],
  ['🏢','empresa','trabalho','escritorio'],
  ['📌','fixo','importante','anotacao'],
  ['🗂️','arquivo','pasta','organizacao'],
  ['📊','relatorio','apresentacao','trabalho'],
  ['🖋️','assinatura','contrato','trabalho'],
  // Outros / Genérico
  ['⭐','estrela','favorito','destaque'],
  ['🌟','destaque','especial','importante'],
  ['🔖','marcador','categoria','label'],
  ['🏷️','etiqueta','categoria','tag'],
  ['📂','pasta','arquivo','organizacao'],
  ['❓','duvida','outros','sem categoria'],
  ['✅','concluido','pago','confirmado'],
  ['⚡','energia','rapido','urgente'],
  ['🌍','internacional','exterior','viagem'],
  ['🎀','presente','laco','especial'],
];

const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316',
  '#f59e0b','#22c55e','#10b981','#14b8a6','#3b82f6',
  '#0ea5e9','#d946ef','#64748b','#84cc16',
];

const GROUPS = [
  { label: '💰 Finanças',    range: [0,  14] },
  { label: '🏠 Casa',        range: [15, 33] },
  { label: '🍽️ Alimentação', range: [34, 53] },
  { label: '🚗 Transporte',  range: [54, 69] },
  { label: '🏥 Saúde',       range: [70, 84] },
  { label: '📚 Educação',    range: [85, 99] },
  { label: '🎉 Lazer',       range: [100,119] },
  { label: '🛍️ Compras',    range: [120,138] },
  { label: '📡 Serviços',    range: [139,150] },
  { label: '👨‍👩‍👧 Família',  range: [151,162] },
  { label: '💼 Trabalho',    range: [163,172] },
  { label: '🔖 Outros',      range: [173,182] },
];

type View = 'list' | 'add' | 'edit';

// ─── Sub-components OUTSIDE main component (avoids React crash) ──────────────

interface EmojiGridProps {
  emojis: string[];
  selectedIcon: string;
  onSelect: (e: string) => void;
}
function EmojiGrid({ emojis, selectedIcon, onSelect }: EmojiGridProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {emojis.map((e, i) => (
        <button
          key={`${e}-${i}`}
          type="button"
          onClick={() => onSelect(e)}
          style={{
            width: 38, height: 38, fontSize: 22, borderRadius: 8,
            border: 'none', cursor: 'pointer',
            background: selectedIcon === e ? '#6366f122' : 'transparent',
            outline: selectedIcon === e ? '2px solid #6366f1' : 'none',
            transition: 'all 0.1s',
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

interface EmojiPickerProps {
  selectedIcon: string;
  emojiSearch: string;
  filteredEmojis: string[] | null;
  onSearchChange: (val: string) => void;
  onSelect: (e: string) => void;
}
function EmojiPicker({ selectedIcon, emojiSearch, filteredEmojis, onSearchChange, onSelect }: EmojiPickerProps) {
  return (
    <div style={{
      border: '1px solid var(--border-glass)', borderRadius: 12,
      background: 'var(--bg-secondary)', overflow: 'hidden', marginTop: 8,
    }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-glass)' }}>
        <input
          className="form-input"
          placeholder="🔍 Buscar emoji (ex: casa, saúde, comida...)"
          value={emojiSearch}
          onChange={ev => onSearchChange(ev.target.value)}
          style={{ marginBottom: 0, fontSize: 13 }}
        />
      </div>
      <div style={{ maxHeight: 260, overflowY: 'auto', padding: '10px 12px' }}>
        {filteredEmojis ? (
          filteredEmojis.length === 0
            ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 16, fontSize: 13 }}>Nenhum emoji encontrado</div>
            : <EmojiGrid emojis={filteredEmojis} selectedIcon={selectedIcon} onSelect={onSelect} />
        ) : (
          GROUPS.map(g => (
            <div key={g.label} style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 11, color: 'var(--text-muted)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
              }}>{g.label}</div>
              <EmojiGrid
                emojis={EMOJI_DATA.slice(g.range[0], g.range[1] + 1).map(([e]) => e)}
                selectedIcon={selectedIcon}
                onSelect={onSelect}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface CategoryFormProps {
  name: string;
  icon: string;
  color: string;
  saving: boolean;
  showPicker: boolean;
  emojiSearch: string;
  filteredEmojis: string[] | null;
  onNameChange: (v: string) => void;
  onIconSelect: (e: string) => void;
  onColorChange: (c: string) => void;
  onTogglePicker: () => void;
  onSearchChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}
function CategoryForm({
  name, icon, color, saving, showPicker, emojiSearch, filteredEmojis,
  onNameChange, onIconSelect, onColorChange, onTogglePicker, onSearchChange,
  onCancel, onSubmit,
}: CategoryFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Nome da Categoria</label>
        <input
          className="form-input"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          required
          placeholder="Ex: Mercado, Saúde, Academia..."
        />
      </div>

      <div className="form-group">
        <label>Ícone</label>
        <div
          onClick={onTogglePicker}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            background: `${color}18`, borderRadius: 10, border: `2px solid ${color}44`,
            cursor: 'pointer', userSelect: 'none',
          }}
        >
          <span style={{ fontSize: 30 }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{name || 'Prévia da categoria'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {showPicker ? 'Clique para fechar' : 'Clique para escolher ícone'}
            </div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {showPicker ? '▲' : '▼'}
          </span>
        </div>
        {showPicker && (
          <EmojiPicker
            selectedIcon={icon}
            emojiSearch={emojiSearch}
            filteredEmojis={filteredEmojis}
            onSearchChange={onSearchChange}
            onSelect={onIconSelect}
          />
        )}
      </div>

      <div className="form-group">
        <label>Cor</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {PRESET_COLORS.map(c => (
            <button key={c} type="button" onClick={() => onColorChange(c)} style={{
              width: 30, height: 30, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
              outline: color === c ? '3px solid white' : 'none',
              boxShadow: color === c ? `0 0 0 4px ${c}55` : 'none',
              transform: color === c ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.15s',
            }} />
          ))}
          <input
            type="color"
            value={color}
            onChange={e => onColorChange(e.target.value)}
            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }}
          />
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : '💾 Salvar'}
        </button>
      </div>
    </form>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CategoryManagementModal({
  isOpen, onClose, categories, onAdd, onEdit, onDelete,
}: CategoryManagementModalProps) {
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const filteredEmojis = useMemo(() => {
    if (!emojiSearch.trim()) return null;
    const q = emojiSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return EMOJI_DATA
      .filter(([, ...terms]) => terms.some(t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)))
      .map(([e]) => e);
  }, [emojiSearch]);

  const filteredCategories = catSearch
    ? categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
    : categories;

  // Conditional return AFTER all hooks
  if (!isOpen) return null;

  const openAdd = () => {
    setName(''); setIcon('📌'); setColor('#6366f1');
    setEmojiSearch(''); setShowPicker(false); setView('add');
  };
  const openEdit = (c: Category) => {
    setSelected(c); setName(c.name); setIcon(c.icon);
    setColor(c.color || '#6366f1'); setEmojiSearch(''); setShowPicker(false); setView('edit');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({ name: name.trim(), icon, color });
    setSaving(false); setView('list');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    await onEdit(selected.id, { name: name.trim(), icon, color });
    setSaving(false); setView('list');
  };

  const handleDelete = (c: Category) => {
    if (window.confirm(`Excluir a categoria "${c.name}"?`)) onDelete(c.id);
  };

  const handleIconSelect = (e: string) => {
    setIcon(e);
    setShowPicker(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {view === 'list' && '🗂️ Categorias'}
            {view === 'add'  && '➕ Nova Categoria'}
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
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
              />
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {filteredCategories.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-state-icon">🗂️</div>
                  <div className="empty-state-text">Nenhuma categoria encontrada</div>
                </div>
              ) : filteredCategories.map(c => (
                <div key={c.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
                  padding: '10px 14px', background: 'var(--bg-glass)',
                  borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-glass)', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: `${c.color || '#6366f1'}22`,
                      border: `2px solid ${c.color || '#6366f1'}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}>{c.icon}</div>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(c)} title="Editar" style={{
                      background: 'var(--purple-bg)', color: 'var(--purple)',
                      border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13,
                    }}>✏️</button>
                    <button onClick={() => handleDelete(c)} title="Excluir" style={{
                      background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                      border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13,
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

        {(view === 'add' || view === 'edit') && (
          <CategoryForm
            name={name}
            icon={icon}
            color={color}
            saving={saving}
            showPicker={showPicker}
            emojiSearch={emojiSearch}
            filteredEmojis={filteredEmojis}
            onNameChange={setName}
            onIconSelect={handleIconSelect}
            onColorChange={setColor}
            onTogglePicker={() => setShowPicker(p => !p)}
            onSearchChange={setEmojiSearch}
            onCancel={() => setView('list')}
            onSubmit={view === 'add' ? handleAdd : handleEdit}
          />
        )}
      </div>
    </div>
  );
}
