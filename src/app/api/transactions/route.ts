import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;
  return getSession(token);
}

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const scope = searchParams.get('scope');
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  let transactions = await db.getTransactions();

  // Filter based on scope
  if (scope === 'pessoal') {
    transactions = transactions.filter(t => t.userId === user.id && t.scope === 'pessoal');
  } else if (scope === 'casal') {
    transactions = transactions.filter(t => t.scope === 'casal');
  } else if (scope === 'parceiro') {
    const users = await db.getUsers();
    const partner = users.find(u => u.id !== user.id);
    if (partner) {
      transactions = transactions.filter(t => t.userId === partner.id && t.scope === 'pessoal');
    }
  } else {
    // 'todos' - show user's personal + all couple
    transactions = transactions.filter(t => t.userId === user.id || t.scope === 'casal');
  }

  if (month) transactions = transactions.filter(t => t.month === month);
  if (type) transactions = transactions.filter(t => t.type === type);
  if (status) transactions = transactions.filter(t => t.status === status);
  if (category) transactions = transactions.filter(t => t.categoryLabel === category);

  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ transactions });
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const transaction = await db.addTransaction({
      userId: user.id,
      type: body.type,
      scope: body.scope,
      expenseType: body.expenseType || 'flexivel',
      description: body.description,
      amount: Number(body.amount),
      paidBy: body.paidBy,
      user1Amount: body.rodrigoAmount ? Number(body.rodrigoAmount) : undefined,
      user2Amount: body.mariAmount ? Number(body.mariAmount) : undefined,
      dueDate: body.dueDate,
      installmentCurrent: body.installmentCurrent ? Number(body.installmentCurrent) : undefined,
      installmentTotal: body.installmentTotal ? Number(body.installmentTotal) : undefined,
      categoryLabel: body.categoryLabel,
      status: body.status,
      month: body.month || new Date().toISOString().slice(0, 7),
      isRecurring: body.isRecurring || false,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Error adding transaction:', error);
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (updates.amount) updates.amount = Number(updates.amount);
    if (updates.rodrigoAmount) updates.user1Amount = Number(updates.rodrigoAmount);
    if (updates.mariAmount) updates.user2Amount = Number(updates.mariAmount);

    const transaction = await db.updateTransaction(id, updates);
    if (!transaction) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  try {
    await db.deleteTransaction(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
