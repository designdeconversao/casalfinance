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

  const wallets = await db.getWallets();
  return NextResponse.json({ wallets });
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, balance, isJoint, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const wallet = await db.addWallet({
      name,
      balance: balance || 0,
      isJoint: isJoint || false,
      userId: isJoint ? undefined : user.id,
      color: color || '#64748b'
    });

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json({ error: 'Erro ao criar carteira' }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  try {
    // Check if wallet is empty or has transactions? 
    // For now, simple delete. In a real app we might want to check constraints.
    await db.deleteWallet(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wallet:', error);
    return NextResponse.json({ error: 'Erro ao excluir carteira' }, { status: 500 });
  }
}
