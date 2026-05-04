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

  // Auto-seed default categories (adds missing ones)
  await db.seedCategories();

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

export async function PUT(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, name, icon, color } = body;

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const category = await db.updateCategory(id, { name, icon, color });
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  try {
    await db.deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
