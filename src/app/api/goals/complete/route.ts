import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { goalId, action, walletId } = await request.json(); // action: 'purchase' | 'refund'

    if (!goalId || !action) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { deposits: true }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Objetivo não encontrado' }, { status: 404 });
    }

    const amount = goal.currentAmount;

    await prisma.$transaction(async (tx) => {
      // 1. Mark goal as completed
      await tx.goal.update({
        where: { id: goalId },
        data: { status: 'concluido' }
      });

      if (action === 'purchase') {
        // Create an expense record for history, but don't touch wallet balance
        // since it was already deducted during deposits.
        await tx.transaction.create({
          data: {
            userId: goal.createdByUserId,
            description: `Compra: ${goal.title}`,
            amount: amount,
            type: 'saida',
            categoryLabel: 'Objetivos',
            dueDate: new Date().toISOString(),
            scope: goal.scope,
            status: 'pago',
            month: new Date().toISOString().slice(0, 7),
            expenseType: 'flexivel',
            // No walletId means it doesn't affect balances
          }
        });
      } else if (action === 'refund' && walletId) {
        // Transfer money back to wallet
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: amount } }
        });

        // Create an entry for tracking
        await tx.transaction.create({
          data: {
            userId: goal.createdByUserId,
            description: `Estorno de Objetivo: ${goal.title}`,
            amount: amount,
            type: 'entrada',
            categoryLabel: 'Objetivos',
            dueDate: new Date().toISOString(),
            scope: goal.scope,
            status: 'recebido',
            month: new Date().toISOString().slice(0, 7),
            expenseType: 'flexivel',
            walletId: walletId
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Goal completion error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao finalizar objetivo' }, { status: 500 });
  }
}
