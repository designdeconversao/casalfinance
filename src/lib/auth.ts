import { cookies } from 'next/headers';
import { db } from './db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Simple session token store (in-memory for dev, could be file-based)
const sessions: Map<string, { userId: string; expires: number }> = new Map();

export async function login(email: string, password: string) {
  await db.seedUsers();
  const user = await db.getUserByEmail(email);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const token = uuidv4();
  sessions.set(token, {
    userId: user.id,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export async function getSession(token: string) {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expires) {
    sessions.delete(token);
    return null;
  }
  const user = await db.getUserById(session.userId);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return await getSession(token);
}

export function logout(token: string) {
  sessions.delete(token);
}
