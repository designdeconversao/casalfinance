import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }
  const user = await getSession(token);
  return NextResponse.json({ user });
}
