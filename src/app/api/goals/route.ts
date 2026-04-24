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

  const [goals, deposits, steps, users] = await Promise.all([
    db.getGoals(),
    db.getGoalDeposits(),
    db.getGoalSteps(),
    db.getUsers()
  ]);

  const goalsWithProgress = goals.map(goal => {
    const goalDeposits = deposits.filter(d => d.goalId === goal.id);
    const goalSteps = steps.filter(s => s.goalId === goal.id).sort((a, b) => a.order - b.order);
    const currentAmount = goalDeposits.reduce((sum, d) => sum + d.amount, 0);

    let targetAmount = goal.targetAmount;
    if (goal.calcType === 'sum_of_steps') {
      targetAmount = goalSteps.reduce((sum, s) => sum + (s.estimatedAmount || 0), 0);
    }

    return {
      ...goal,
      targetAmount,
      currentAmount,
      deposits: goalDeposits.map(d => ({
        ...d,
        userName: users.find(u => u.id === d.userId)?.name || 'Desconhecido',
      })),
      steps: goalSteps,
    };
  });

  return NextResponse.json({ goals: goalsWithProgress });
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const goal = await db.addGoal({
      createdByUserId: user.id,
      scope: body.scope,
      title: body.title,
      description: body.description || '',
      icon: body.icon || '🎯',
      targetAmount: Number(body.targetAmount) || 0,
      calcType: body.calcType || 'fixed',
      deadline: body.deadline,
      status: 'ativo',
      currentAmount: 0,
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar objetivo' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (updates.targetAmount) updates.targetAmount = Number(updates.targetAmount);

    const goal = await db.updateGoal(id, updates);
    if (!goal) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    return NextResponse.json({ goal });
  } catch {
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
    await db.deleteGoal(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
