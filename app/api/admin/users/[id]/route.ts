import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthenticatedRequest, getRequestUser } from '@/lib/auth/middleware';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';
import { getUserById, getUserByEmail, updateUser, deleteUser, getAllUsers } from '@/lib/db/database';

// Update a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id: userId } = await params;
      const { name, email, role, assignedZoneIds } = await req.json();

    // Find user
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Check if email is being changed to an existing email
    if (email && email !== targetUser.email) {
      const existingUser = await getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already in use',
          },
          { status: 400 }
        );
      }
    }

    // Track what changed for audit log
    const changes: Record<string, any> = {};

    // Build update object
    const updates: any = {};
    if (name && name !== targetUser.name) {
      changes.name = { from: targetUser.name, to: name };
      updates.name = name;
    }
    if (email && email !== targetUser.email) {
      changes.email = { from: targetUser.email, to: email };
      updates.email = email;
    }
    if (role && role !== targetUser.role) {
      changes.role = { from: targetUser.role, to: role };
      updates.role = role;
    }
    if (assignedZoneIds !== undefined) {
      changes.assignedZoneIds = { from: targetUser.assignedZoneIds, to: assignedZoneIds };
      updates.assignedZoneIds = assignedZoneIds;
    }

    // Update user in database
    const updatedUser = await updateUser(userId, updates);

    // Log successful user update
    const adminUser = getRequestUser(req);
    await createAuditLog({
      action: 'user.updated',
      severity: 'info',
      ...getUserInfoFromRequest(request, adminUser),
      resource: updatedUser?.name || targetUser.name,
      resourceId: userId,
      details: {
        targetUserEmail: updatedUser?.email || targetUser.email,
        targetUserName: updatedUser?.name || targetUser.name,
        changes,
      },
      success: true,
    });

      return NextResponse.json({
        success: true,
        data: {
          id: updatedUser?.id || userId,
          name: updatedUser?.name || targetUser.name,
          email: updatedUser?.email || targetUser.email,
          role: updatedUser?.role || targetUser.role,
          assignedZoneIds: updatedUser?.assignedZoneIds || targetUser.assignedZoneIds,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update user',
        },
        { status: 500 }
      );
    }
  });
}

// Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id: userId } = await params;

    // Find user
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Prevent deleting the last admin
    if (targetUser.role === 'admin') {
      const allUsers = await getAllUsers();
      const adminCount = allUsers.filter((u) => u.role === 'admin').length;

      if (adminCount === 1) {
      // Log failed deletion attempt
      const adminUser = getRequestUser(req);
      await createAuditLog({
        action: 'user.deleted',
        severity: 'warning',
        ...getUserInfoFromRequest(request, adminUser),
        resource: targetUser.name,
        resourceId: userId,
        details: {
          targetUserEmail: targetUser.email,
          targetUserName: targetUser.name,
        },
        success: false,
        error: 'Cannot delete the last admin user',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete the last admin user',
        },
        { status: 400 }
      );
      }
    }

    // Store user info before deletion
    const deletedUserInfo = {
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    };

    // Delete user from database
    await deleteUser(userId);

    // Log successful user deletion
    const adminUser = getRequestUser(req);
    await createAuditLog({
      action: 'user.deleted',
      severity: 'info',
      ...getUserInfoFromRequest(request, adminUser),
      resource: deletedUserInfo.name,
      resourceId: userId,
      details: deletedUserInfo,
      success: true,
    });

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete user',
        },
        { status: 500 }
      );
    }
  });
}
