import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rodrigoId = "f9399cb5-38f7-4b52-b2f8-befbf44aea18";
  const mariId = "57f7c61a-5ff1-4f6f-af66-6e19d8519664";

  console.log('Seeding wallets...');

  await prisma.wallet.createMany({
    data: [
      {
        name: 'Nubank Rodrigo',
        userId: rodrigoId,
        balance: 1000,
        isJoint: false,
        color: '#8a05be'
      },
      {
        name: 'Nubank Mari',
        userId: mariId,
        balance: 1000,
        isJoint: false,
        color: '#8a05be'
      },
      {
        name: 'Conta Conjunta Nubank',
        userId: null,
        balance: 500,
        isJoint: true,
        color: '#8a05be'
      }
    ]
  });

  console.log('Wallets seeded!');
}

main().finally(() => prisma.$disconnect());
