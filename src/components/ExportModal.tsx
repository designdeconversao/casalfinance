'use client';

import { useState } from 'react';
interface Transaction {
  id: string; userId: string; type: string; scope: string; expenseType: string;
  description: string; amount: number; dueDate: string; categoryLabel: string;
  status: string; month: string; isRecurring: boolean; createdAt: string;
  installmentCurrent?: number; installmentTotal?: number;
  walletId?: string; destinationWalletId?: string;
  paidBy?: string; user1Amount?: number; user2Amount?: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export default function ExportModal({ isOpen, onClose, transactions }: ExportModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    if (!startDate || !endDate) {
      alert("Por favor, selecione as datas de início e fim.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Adjust end date to include the whole day
    end.setHours(23, 59, 59, 999);

    const filtered = transactions.filter(t => {
      const d = new Date(t.dueDate);
      return d >= start && d <= end;
    });

    if (filtered.length === 0) {
      alert("Nenhuma transação encontrada no período selecionado.");
      return;
    }

    // CSV Generation — semicolon separator (Excel BR default) + all fields quoted for safe UTF-8
    const SEP = ';';
    const q = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Status', 'Escopo', 'Pago Por', 'Parcelamento'];

    const rows = filtered.map(t => {
      const type = t.type === 'entrada' ? 'Entrada' : t.type === 'saida' ? 'Saída' : 'Transferência';
      const amount = t.amount.toFixed(2).replace('.', ',');
      const date = new Date(t.dueDate + 'T12:00:00').toLocaleDateString('pt-BR');
      const scope = t.scope === 'casal' ? 'Casal' : 'Pessoal';
      const statusMap: Record<string, string> = {
        pago: 'Pago', atrasado: 'Atrasado', a_vencer: 'À Vencer', recebido: 'Recebido', a_receber: 'À Receber',
      };
      const status = statusMap[t.status] || t.status;
      const paidBy = t.paidBy || '';
      const installment = t.installmentCurrent && t.installmentTotal
        ? `${t.installmentCurrent}/${t.installmentTotal}`
        : '';

      return [date, type, t.description, t.categoryLabel, amount, status, scope, paidBy, installment]
        .map(q)
        .join(SEP);
    });

    const csvContent = [headers.map(q).join(SEP), ...rows].join('\r\n');

    // UTF-8 BOM ensures Excel opens with correct encoding
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `extrato_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2>⬇️ Exportar Extrato</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleExport}>Exportar CSV</button>
        </div>
      </div>
    </div>
  );
}
