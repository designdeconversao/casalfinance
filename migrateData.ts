import "dotenv/config";
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data');

function readJSON(filename: string, defaultVal: any) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return defaultVal;
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

async function migrate() {
  console.log('Cleaning up existing data...');
  // Delete in reverse order of dependencies
  await prisma.goalStep.deleteMany();
  await prisma.goalDeposit.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Migrating categories...');
  const categories = readJSON('categories.json', []);
  for (const c of categories) {
    await prisma.category.create({ data: c });
  }

  console.log('Migrating users...');
  const users = readJSON('users.json', []);
  for (const u of users) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        createdAt: new Date(u.createdAt)
      },
    });
  }

  console.log('Migrating transactions...');
  const transactions = readJSON('transactions.json', []);
  for (const t of transactions) {
    const { id, createdAt, rodrigoAmount, mariAmount, ...rest } = t;
    await prisma.transaction.create({
      data: {
        ...rest,
        id,
        user1Amount: rodrigoAmount || t.user1Amount || null,
        user2Amount: mariAmount || t.user2Amount || null,
        createdAt: new Date(createdAt)
      },
    });
  }

  console.log('Migrating goals...');
  const goals = readJSON('goals.json', []);
  for (const g of goals) {
    const { id, createdAt, ...rest } = g;
    await prisma.goal.create({
      data: {
        ...rest,
        id,
        createdAt: new Date(createdAt)
      },
    });
  }

  console.log('Migrating deposits...');
  const deposits = readJSON('deposits.json', []);
  for (const d of deposits) {
    const { id, createdAt, ...rest } = d;
    await prisma.goalDeposit.create({
      data: {
        ...rest,
        id,
        createdAt: new Date(createdAt)
      },
    });
  }

  console.log('Migrating goal steps...');
  const steps = readJSON('goalSteps.json', []);
  for (const s of steps) {
    const { id, createdAt, ...rest } = s;
    await prisma.goalStep.create({
      data: {
        ...rest,
        id,
        createdAt: new Date(createdAt)
      },
    });
  }

  console.log('Migration complete!');
}

migrate()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
