import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest, getRequestUser } from '@/lib/auth/middleware';
import { getUserById, updateUser } from '@/lib/db/database';

export async function PATCH(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const user = getRequestUser(req);
      const { userId, name, email } = await request.json();

      if (!name || !email) {
        return NextResponse.json(
          {
            success: false,
            error: 'Name and email are required',
          },
          { status: 400 }
        );
      }

      // Ensure users can only modify their own account (unless admin)
      const targetUserId = userId || user.userId;
      if (targetUserId !== user.userId && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Find user
      const targetUser = await getUserById(targetUserId);

      if (!targetUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'User not found',
          },
          { status: 404 }
        );
      }

      // Update user in database
      await updateUser(targetUserId, { name, email });

      return NextResponse.json({
        success: true,
        data: {
          name,
          email,
        },
      });
    } catch (error) {
      console.error('Error updating account:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update account',
        },
        { status: 500 }
      );
    }
  });
}
