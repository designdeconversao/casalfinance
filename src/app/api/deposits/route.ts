import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;
  return getSession(token);
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const depositDate = body.depositDate || new Date().toISOString().slice(0, 10);

    const deposit = await db.addGoalDeposit({
      goalId: body.goalId,
      userId: user.id,
      amount,
      depositDate,
      source: body.source || '',
      note: body.note || '',
    });

    // --- AUTO-CREATE expense transaction linked to this deposit ---
    const goals = await db.getGoals();
    const goal = goals.find(g => g.id === body.goalId);
    
    if (goal) {
      const month = depositDate.slice(0, 7); // "2026-04"
      await db.addTransaction({
        userId: user.id,
        type: 'saida',
        scope: goal.scope,
        expenseType: 'flexivel',
        description: `Aporte: ${goal.icon} ${goal.title}`,
        amount,
        dueDate: depositDate,
        categoryLabel: 'Objetivo',
        status: 'pago',
        month,
        isRecurring: false,
        linkedDepositId: deposit.id,
      });

      // Check if goal is now complete
      const allDeposits = await db.getGoalDeposits();
      const goalDeposits = allDeposits.filter(d => d.goalId === body.goalId);
      const total = goalDeposits.reduce((sum, d) => sum + d.amount, 0);
      
      if (total >= goal.targetAmount) {
        await db.updateGoal(goal.id, { status: 'concluido' });
      }
    }

    return NextResponse.json({ deposit }, { status: 201 });
  } catch (error) {
    console.error('Error in deposit:', error);
    return NextResponse.json({ error: 'Erro ao depositar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  try {
    await db.deleteGoalDeposit(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting deposit:', error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
