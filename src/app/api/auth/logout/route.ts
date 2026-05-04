import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (token) logout(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('session_token');
  return response;
}
