import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getAllUsers } from '@/lib/db/database';

// GET - Get all users (used by setup page to check if users exist)
export async function GET(request: NextRequest) {
  return requireAuth(request, async (_req: AuthenticatedRequest) => {
    try {
      const users = await getAllUsers();
      return NextResponse.json({
        success: true,
        data: { users },
      });
    } catch (error) {
      console.error('Error getting users:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get users',
        },
        { status: 500 }
      );
    }
  });
}
