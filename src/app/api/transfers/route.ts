import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { fromWalletId, toWalletId, amount, date, description } = await request.json();

    if (!fromWalletId || !toWalletId || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const value = parseFloat(amount);

    // Atomic transaction for transfer
    await prisma.$transaction(async (tx) => {
      // 1. Decrease source wallet
      const fromWallet = await tx.wallet.update({
        where: { id: fromWalletId },
        data: { balance: { decrement: value } }
      });

      if (fromWallet.balance < 0) {
        throw new Error('Saldo insuficiente na carteira de origem');
      }

      // 2. Increase destination wallet
      await tx.wallet.update({
        where: { id: toWalletId },
        data: { balance: { increment: value } }
      });

      // 3. Create a single record for the transfer
      await tx.transaction.create({
        data: {
          userId: fromWallet.userId || 'shared', // Fallback
          description: description || `Transferência: ${fromWallet.name} → ${toWalletId}`,
          amount: value,
          type: 'transferencia',
          categoryLabel: 'Transferência',
          dueDate: new Date(date).toISOString(),
          scope: 'pessoal',
          walletId: fromWalletId,
          destWalletId: toWalletId,
          expenseType: 'flexivel',
          status: 'pago',
          month: date.slice(0, 7),
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Transfer error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao realizar transferência' }, { status: 500 });
  }
}
