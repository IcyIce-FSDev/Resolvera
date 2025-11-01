import { useState } from 'react';
import { addUser, updateUser, deleteUser } from '@/lib/admin/adminApi';
import type { User, Zone, Message } from '@/app/admin/types';

export function useUserManagement(onDataRefresh: () => Promise<void>) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserZones, setNewUserZones] = useState<string[]>([]);

  const resetNewUserForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('user');
    setNewUserZones([]);
  };

  const handleAddUser = async (e: React.FormEvent): Promise<Message | null> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        assignedZoneIds: newUserZones,
      });

      resetNewUserForm();
      setShowAddUser(false);
      await onDataRefresh();

      return { type: 'success', text: 'User created successfully' };
    } catch (error) {
      return { type: 'error', text: error instanceof Error ? error.message : 'Failed to create user' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent): Promise<Message | null> => {
    e.preventDefault();
    if (!editingUser) return null;

    setIsSubmitting(true);

    try {
      await updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        assignedZoneIds: editingUser.assignedZoneIds,
      });

      setEditingUser(null);
      await onDataRefresh();

      return { type: 'success', text: 'User updated successfully' };
    } catch (error) {
      return { type: 'error', text: error instanceof Error ? error.message : 'Failed to update user' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string): Promise<Message | null> => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return null;
    }

    setIsSubmitting(true);

    try {
      await deleteUser(userId);
      await onDataRefresh();

      return { type: 'success', text: 'User deleted successfully' };
    } catch (error) {
      return { type: 'error', text: error instanceof Error ? error.message : 'Failed to delete user' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleZoneAssignment = (zoneId: string, isEditing: boolean = false) => {
    if (isEditing && editingUser) {
      const currentZones = editingUser.assignedZoneIds || [];
      const updatedZones = currentZones.includes(zoneId)
        ? currentZones.filter(id => id !== zoneId)
        : [...currentZones, zoneId];
      setEditingUser({ ...editingUser, assignedZoneIds: updatedZones });
    } else {
      const currentZones = newUserZones || [];
      const updatedZones = currentZones.includes(zoneId)
        ? currentZones.filter(id => id !== zoneId)
        : [...currentZones, zoneId];
      setNewUserZones(updatedZones);
    }
  };

  return {
    // State
    showAddUser,
    editingUser,
    isSubmitting,
    newUserName,
    newUserEmail,
    newUserPassword,
    newUserRole,
    newUserZones,

    // Setters
    setShowAddUser,
    setEditingUser,
    setNewUserName,
    setNewUserEmail,
    setNewUserPassword,
    setNewUserRole,
    setNewUserZones,

    // Actions
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    toggleZoneAssignment,
    resetNewUserForm,
  };
}
