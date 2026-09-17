'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function verifyPin(pin: string) {
  const correctPin = process.env.ACCESS_PIN;

  if (!correctPin) {
    // If the server doesn't have a PIN configured, we assume it's insecurely open or misconfigured.
    // However, it's safer to fail closed. But for testing, let's just log it.
    console.warn("ACCESS_PIN is not configured in .env!");
  }

  if (pin === correctPin) {
    // 1 year expiration
    const ONE_YEAR = 60 * 60 * 24 * 365;
    
    // In Next 15+ cookies() might be a promise, but wait, Next 16 might require `await cookies()`.
    const cookieStore = await cookies();
    cookieStore.set('app_access_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: ONE_YEAR,
      path: '/',
      sameSite: 'lax',
    });

    return { success: true };
  }

  return { success: false, error: 'PIN incorrecto' };
}
