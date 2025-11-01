import { NextResponse } from 'next/server';
import { clearTokenCookie } from '@/lib/auth/jwt';

export async function POST() {
  try {
    // Clear the JWT token cookie
    await clearTokenCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
