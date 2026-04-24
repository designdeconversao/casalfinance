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

  const categories = await db.getCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, icon, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    }

    const categories = await db.getCategories();

    // Check if category already exists
    const exists = categories.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return NextResponse.json({ error: 'Categoria já existe' }, { status: 409 });
    }

    const category = await db.addCategory({
      name: name.trim(),
      icon: icon || '📌',
      color: color || '#64748b',
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error adding category:', error);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
