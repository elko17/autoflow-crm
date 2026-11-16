import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password || password.length > 200) {
      return NextResponse.json({ error: 'Введите email и пароль.' }, { status: 400 });
    }
    const result = await authenticate(email, password);
    if (!result.ok) {
      if (result.reason === 'rate_limited') {
        return NextResponse.json({ error: 'Слишком много попыток. Повторите через 15 минут.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Неверный email или пароль.' }, { status: 401 });
    }
    return NextResponse.json({ user: result.user });
  } catch {
    return NextResponse.json({ error: 'Сервис авторизации временно недоступен.' }, { status: 503 });
  }
}
