import { PrismaClient } from '@prisma/client';

// Prisma client should be a singleton in development to prevent too many connections
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// --- Types (Exported for convenience, matching Prisma models) ---
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'rodrigo' | 'mari';
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId?: string;
  destWalletId?: string;
  type: 'entrada' | 'saida' | 'transferencia';
  scope: 'pessoal' | 'casal';
  expenseType: 'fixo' | 'flexivel';
  description: string;
  amount: number;
  paidBy?: 'rodrigo' | 'mari' | 'conjunta' | 'ambos';
  user1Amount?: number;
  user2Amount?: number;
  dueDate: string;
  installmentCurrent?: number;
  installmentTotal?: number;
  categoryLabel: string;
  status: 'pago' | 'atrasado' | 'a_vencer' | 'recebido' | 'a_receber';
  month: string;
  isRecurring: boolean;
  createdAt: string;
  linkedDepositId?: string;
}

export interface Wallet {
  id: string;
  userId?: string;
  name: string;
  balance: number;
  isJoint: boolean;
  color?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  createdByUserId: string;
  scope: 'pessoal' | 'casal';
  title: string;
  description: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  calcType?: 'fixed' | 'sum_of_steps';
  deadline: string;
  status: 'ativo' | 'concluido' | 'cancelado';
  createdAt: string;
}

export interface GoalDeposit {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  depositDate: string;
  source: string;
  note: string;
  createdAt: string;
  linkedStepId?: string;
  walletId?: string;
}

export interface GoalStep {
  id: string;
  goalId: string;
  title: string;
  estimatedAmount: number;
  currentAmount: number;
  deadline: string;
  completed: boolean;
  completedAt?: string;
  order: number;
  note?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// --- Database Logic (Refactored to Prisma) ---

export const db = {
  // --- Wallets ---
  getWallets: async () => {
    const wallets = await prisma.wallet.findMany();
    return wallets.map(w => ({ ...w, createdAt: w.createdAt.toISOString() })) as Wallet[];
  },

  addWallet: async (wallet: Omit<Wallet, 'id' | 'createdAt'>) => {
    const newW = await prisma.wallet.create({
      data: {
        ...wallet,
        createdAt: new Date(),
      },
    });
    return { ...newW, createdAt: newW.createdAt.toISOString() } as Wallet;
  },

  updateWallet: async (id: string, data: Partial<Wallet>) => {
    const updated = await prisma.wallet.update({
      where: { id },
      data: {
        ...data as any,
      },
    });
    return { ...updated, createdAt: updated.createdAt.toISOString() } as Wallet;
  },

  deleteWallet: async (id: string) => {
    await prisma.wallet.delete({ where: { id } });
  },

  // --- Users ---
  getUsers: async () => {
    const users = await prisma.user.findMany();
    return users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })) as User[];
  },

  getUserByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { ...user, createdAt: user.createdAt.toISOString() } as User;
  },

  getUserById: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return { ...user, createdAt: user.createdAt.toISOString() } as User;
  },

  seedUsers: async () => {
    // No-op: users are already migrated
  },

  addUser: async (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser = await prisma.user.create({
      data: {
        ...user,
        createdAt: new Date(),
      },
    });
    return { ...newUser, createdAt: newUser.createdAt.toISOString() } as User;
  },

  // --- Transactions ---
  getTransactions: async () => {
    const transactions = await prisma.transaction.findMany();
    return transactions.map(t => ({ 
      ...t, 
      createdAt: t.createdAt.toISOString(),
      paidBy: t.paidBy as any,
      type: t.type as any,
      scope: t.scope as any,
      expenseType: t.expenseType as any,
      status: t.status as any
    })) as Transaction[];
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    // Start a transaction to ensure balance is updated
    return await prisma.$transaction(async (tx) => {
      const newT = await tx.transaction.create({
        data: {
          ...transaction,
          createdAt: new Date(),
        },
      });

      // Update wallet balance
      if (transaction.walletId) {
        if (transaction.type === 'saida') {
          await tx.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { decrement: transaction.amount } },
          });
        } else if (transaction.type === 'entrada') {
          await tx.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { increment: transaction.amount } },
          });
        } else if (transaction.type === 'transferencia' && transaction.destWalletId) {
          // Source wallet decrement
          await tx.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { decrement: transaction.amount } },
          });
          // Dest wallet increment
          await tx.wallet.update({
            where: { id: transaction.destWalletId },
            data: { balance: { increment: transaction.amount } },
          });
        }
      }

      return { ...newT, createdAt: newT.createdAt.toISOString() } as Transaction;
    });
  },

  updateTransaction: async (id: string, data: Partial<Transaction>) => {
    return await prisma.$transaction(async (tx) => {
      const oldT = await tx.transaction.findUnique({ where: { id } });
      if (!oldT) throw new Error('Transaction not found');

      // Reverse old balance
      if (oldT.walletId) {
        if (oldT.type === 'saida') {
          await tx.wallet.update({
            where: { id: oldT.walletId },
            data: { balance: { increment: oldT.amount } },
          });
        } else if (oldT.type === 'entrada') {
          await tx.wallet.update({
            where: { id: oldT.walletId },
            data: { balance: { decrement: oldT.amount } },
          });
        } else if (oldT.type === 'transferencia' && oldT.destWalletId) {
          await tx.wallet.update({
            where: { id: oldT.walletId },
            data: { balance: { increment: oldT.amount } },
          });
          await tx.wallet.update({
            where: { id: oldT.destWalletId },
            data: { balance: { decrement: oldT.amount } },
          });
        }
      }

      const updated = await tx.transaction.update({
        where: { id },
        data: {
          ...data as any,
        },
      });

      // Apply new balance
      if (updated.walletId) {
        if (updated.type === 'saida') {
          await tx.wallet.update({
            where: { id: updated.walletId },
            data: { balance: { decrement: updated.amount } },
          });
        } else if (updated.type === 'entrada') {
          await tx.wallet.update({
            where: { id: updated.walletId },
            data: { balance: { increment: updated.amount } },
          });
        } else if (updated.type === 'transferencia' && updated.destWalletId) {
          await tx.wallet.update({
            where: { id: updated.walletId },
            data: { balance: { decrement: updated.amount } },
          });
          await tx.wallet.update({
            where: { id: updated.destWalletId },
            data: { balance: { increment: updated.amount } },
          });
        }
      }

      return { ...updated, createdAt: updated.createdAt.toISOString() } as Transaction;
    });
  },

  deleteTransaction: async (id: string) => {
    await prisma.$transaction(async (tx) => {
      const oldT = await tx.transaction.findUnique({ where: { id } });
      if (oldT && oldT.walletId) {
        if (oldT.type === 'saida') {
          await tx.wallet.update({
            where: { id: oldT.walletId },
            data: { balance: { increment: oldT.amount } },
          });
        } else if (oldT.type === 'entrada') {
          await tx.wallet.update({
            where: { id: oldT.walletId },
            data: { balance: { decrement: oldT.amount } },
          });
        } else if (oldT.type === 'transferencia' && oldT.destWalletId) {
          await tx.wallet.update({
            where: { id: oldT.walletId },
            data: { balance: { increment: oldT.amount } },
          });
          await tx.wallet.update({
            where: { id: oldT.destWalletId },
            data: { balance: { decrement: oldT.amount } },
          });
        }
      }
      await tx.transaction.delete({ where: { id } });
    });
  },

  deleteTransactionByDepositId: async (depositId: string) => {
    await prisma.transaction.deleteMany({ where: { linkedDepositId: depositId } });
  },

  // --- Goals ---
  getGoals: async () => {
    const goals = await prisma.goal.findMany();
    return goals.map(g => ({ 
      ...g, 
      createdAt: g.createdAt.toISOString(),
      scope: g.scope as any,
      calcType: g.calcType as any,
      status: g.status as any
    })) as Goal[];
  },

  addGoal: async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newG = await prisma.goal.create({
      data: {
        ...goal,
        createdAt: new Date(),
      },
    });
    return { ...newG, createdAt: newG.createdAt.toISOString() } as Goal;
  },

  updateGoal: async (id: string, data: Partial<Goal>) => {
    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...data as any,
      },
    });
    return { ...updated, createdAt: updated.createdAt.toISOString() } as Goal;
  },

  deleteGoal: async (id: string) => {
    await prisma.goal.delete({ where: { id } });
  },

  // --- Goal Deposits ---
  getGoalDeposits: async () => {
    const deposits = await prisma.goalDeposit.findMany();
    return deposits.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })) as GoalDeposit[];
  },

  addGoalDeposit: async (deposit: Omit<GoalDeposit, 'id' | 'createdAt'>) => {
    return await prisma.$transaction(async (tx) => {
      // 1. Create the deposit
      const newD = await tx.goalDeposit.create({
        data: {
          ...deposit,
          createdAt: new Date(),
        },
      });

      // 2. Update goal's currentAmount
      await tx.goal.update({
        where: { id: deposit.goalId },
        data: { currentAmount: { increment: deposit.amount } },
      });

      // 3. Update wallet balance if provided
      if (deposit.walletId) {
        await tx.wallet.update({
          where: { id: deposit.walletId },
          data: { balance: { decrement: deposit.amount } },
        });
      }

      return { ...newD, createdAt: newD.createdAt.toISOString() } as GoalDeposit;
    });
  },

  deleteGoalDeposit: async (id: string) => {
    await prisma.$transaction(async (tx) => {
      const deposit = await tx.goalDeposit.findUnique({ where: { id } });
      if (!deposit) return;

      // 1. Decrease goal amount
      await tx.goal.update({
        where: { id: deposit.goalId },
        data: { currentAmount: { decrement: deposit.amount } }
      });

      // 2. Increase wallet balance (money back)
      if (deposit.walletId) {
        await tx.wallet.update({
          where: { id: deposit.walletId },
          data: { balance: { increment: deposit.amount } }
        });
      }

      // 3. Delete linked transactions (if any - though deposits create linked transactions in some flows)
      await tx.transaction.deleteMany({ where: { linkedDepositId: id } });

      // 4. Delete the deposit
      await tx.goalDeposit.delete({ where: { id } });
    });
  },

  // --- Goal Steps ---
  getGoalSteps: async () => {
    const steps = await prisma.goalStep.findMany();
    return steps.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })) as GoalStep[];
  },

  addGoalStep: async (step: Omit<GoalStep, 'id' | 'createdAt'>) => {
    const newS = await prisma.goalStep.create({
      data: {
        ...step,
        createdAt: new Date(),
      },
    });
    return { ...newS, createdAt: newS.createdAt.toISOString() } as GoalStep;
  },

  updateGoalStep: async (id: string, data: Partial<GoalStep>) => {
    const updated = await prisma.goalStep.update({
      where: { id },
      data: {
        ...data as any,
      },
    });
    return { ...updated, createdAt: updated.createdAt.toISOString() } as GoalStep;
  },

  deleteGoalStep: async (id: string) => {
    await prisma.goalStep.delete({ where: { id } });
  },

  // --- Categories ---
  getCategories: async () => {
    return await prisma.category.findMany() as Category[];
  },

  addCategory: async (category: Omit<Category, 'id'>) => {
    const newC = await prisma.category.create({
      data: {
        ...category,
      },
    });
    return newC as Category;
  },

  async deleteWallet(id: string) {
    return prisma.wallet.delete({
      where: { id }
    });
  },
};
