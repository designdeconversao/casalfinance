import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;
  return getSession(token);
}

// GET - List steps for a goal
export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get('goalId');
  if (!goalId) return NextResponse.json({ error: 'goalId obrigatório' }, { status: 400 });

  const allSteps = await db.getGoalSteps();
  const steps = allSteps
    .filter(s => s.goalId === goalId)
    .sort((a, b) => a.order - b.order);

  return NextResponse.json({ steps });
}

// POST - Create a new step
export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { goalId, title, estimatedAmount, deadline, note } = body;

    if (!goalId || !title) {
      return NextResponse.json({ error: 'goalId e title obrigatórios' }, { status: 400 });
    }

    // Get max order for this goal
    const allSteps = await db.getGoalSteps();
    const existingSteps = allSteps.filter(s => s.goalId === goalId);
    const maxOrder = existingSteps.length > 0 ? Math.max(...existingSteps.map(s => s.order)) : 0;

    const step = await db.addGoalStep({
      goalId,
      title: title.trim(),
      estimatedAmount: Number(estimatedAmount) || 0,
      deadline: deadline || '',
      completed: false,
      order: maxOrder + 1,
      note: note || '',
      currentAmount: 0,
    });

    return NextResponse.json({ step }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar etapa' }, { status: 500 });
  }
}

// PUT - Update a step (toggle complete, edit, reorder)
export async function PUT(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const allSteps = await db.getGoalSteps();
    const stepBeforeUpdate = allSteps.find(s => s.id === id);

    // If toggling completed, set completedAt
    if (updates.completed === true) {
      updates.completedAt = new Date().toISOString();
      
      if (stepBeforeUpdate && !stepBeforeUpdate.completed) {
        const goals = await db.getGoals();
        const goal = goals.find(g => g.id === stepBeforeUpdate.goalId);
        const stepCost = stepBeforeUpdate.estimatedAmount || 0;
        
        if (goal && stepCost > 0) {
          const allDeposits = await db.getGoalDeposits();
          const goalDeposits = allDeposits.filter(d => d.goalId === goal.id);
          const currentAmount = goalDeposits.reduce((sum, d) => sum + d.amount, 0);
          
          const today = new Date().toISOString().slice(0, 10);
          const month = today.slice(0, 7);
          
          if (currentAmount < stepCost) {
            const missing = stepCost - currentAmount;
            
            // 1. Auto-create deposit for missing amount
            const deposit = await db.addGoalDeposit({
              goalId: goal.id,
              userId: user.id,
              amount: missing,
              depositDate: today,
              source: 'Aporte Auto (Etapa)',
              note: `Complemento automático para: ${stepBeforeUpdate.title}`,
              linkedStepId: id
            });
            
            // 2. Auto-create 'saída' for this deposit in the ledger
            await db.addTransaction({
              userId: user.id,
              type: 'saida',
              scope: goal.scope,
              expenseType: 'flexivel',
              description: `Aporte Automático: ${goal.icon} ${goal.title}`,
              amount: missing,
              dueDate: today,
              categoryLabel: 'Objetivo',
              status: 'pago',
              month,
              isRecurring: false,
              linkedDepositId: deposit.id,
            });
          }
          
          // 3. Deduct the step cost from the goal balance
          await db.addGoalDeposit({
            goalId: goal.id,
            userId: user.id,
            amount: -stepCost,
            depositDate: today,
            source: 'Pagamento Etapa',
            note: `Referente à etapa: ${stepBeforeUpdate.title}`,
            linkedStepId: id
          });
        }
      }
    } else if (updates.completed === false) {
      updates.completedAt = undefined;
      
      if (stepBeforeUpdate && stepBeforeUpdate.completed) {
        // Rollback: User unchecked the step.
        // 1. Delete all deposits linked to this step
        const allDeposits = await db.getGoalDeposits();
        const linkedDeposits = allDeposits.filter(d => d.linkedStepId === id);
        for (const dep of linkedDeposits) {
          await db.deleteGoalDeposit(dep.id); // Also deletes the auto-aporte Transaction
        }
        // 2. Delete the specific Payment Transaction
        await db.deleteTransactionByDepositId(id);
      }
    }

    const step = await db.updateGoalStep(id, updates);
    if (!step) return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 });

    return NextResponse.json({ step });
  } catch (error) {
    console.error('Error updating step:', error);
    return NextResponse.json({ error: 'Erro ao atualizar etapa' }, { status: 500 });
  }
}

// DELETE - Remove a step
export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  try {
    await db.deleteGoalStep(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
  }
}
