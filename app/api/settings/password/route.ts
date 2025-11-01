import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest, getRequestUser } from '@/lib/auth/middleware';
import { getUserById, updateUser } from '@/lib/db/database';
import { verifyPassword, hashPassword } from '@/lib/auth/password';

export async function PATCH(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const authUser = getRequestUser(req);
      const { userId, currentPassword, newPassword } = await request.json();

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Current password and new password are required',
          },
          { status: 400 }
        );
      }

      // Ensure users can only change their own password (unless admin)
      const targetUserId = userId || authUser.userId;
      if (targetUserId !== authUser.userId && authUser.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Find user by ID
      const user = await getUserById(targetUserId);

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: 'User not found',
          },
          { status: 404 }
        );
      }

      // Verify current password (admins can skip this when changing other users' passwords)
      if (targetUserId === authUser.userId) {
        if (!user.passwordHash) {
          return NextResponse.json(
            {
              success: false,
              error: 'User does not have a password set',
            },
            { status: 400 }
          );
        }

        const passwordResult = await verifyPassword(currentPassword, user.passwordHash);

        if (!passwordResult.valid) {
          return NextResponse.json(
            {
              success: false,
              error: 'Current password is incorrect',
            },
            { status: 401 }
          );
        }
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password in database
      await updateUser(targetUserId, { passwordHash: hashedPassword });

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update password',
        },
        { status: 500 }
      );
    }
  });
}
