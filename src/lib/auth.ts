import { cookies } from 'next/headers';
import { db } from './db';
import bcrypt from 'bcryptjs';
import { createHmac, randomBytes } from 'crypto';

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'casalfinance-dev-secret-change-in-production';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

// ─── Token helpers ───────────────────────────────────────────────────────────

function createToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      expires: Date.now() + SESSION_DURATION,
      nonce: randomBytes(8).toString('hex'),
    })
  ).toString('base64url');

  const signature = createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSig = createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');

    if (expectedSig !== signature) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (Date.now() > data.expires) return null;

    return { userId: data.userId };
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  await db.seedUsers();
  const user = await db.getUserByEmail(email);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const token = createToken(user.id);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function getSession(token: string) {
  const verified = verifyToken(token);
  if (!verified) return null;

  const user = await db.getUserById(verified.userId);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return await getSession(token);
}

// Stateless — sem estado server-side para limpar
export function logout(_token: string) {
  // O token expira naturalmente; o cookie é removido pelo route handler
}
