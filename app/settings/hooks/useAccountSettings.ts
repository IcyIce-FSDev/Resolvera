import { useState, useCallback } from 'react';
import { type Session } from '@/lib/auth/session';
import { fetchWithAuth } from '@/lib/api/client';

export interface AccountFormData {
  name: string;
  email: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UseAccountSettingsReturn {
  // Account state
  accountForm: AccountFormData;
  setAccountForm: React.Dispatch<React.SetStateAction<AccountFormData>>;

  // Password state
  passwordForm: PasswordFormData;
  setPasswordForm: React.Dispatch<React.SetStateAction<PasswordFormData>>;

  // UI state
  isSubmitting: boolean;

  // Handlers
  handleUpdateAccount: (e: React.FormEvent, session: Session | null, onSuccess: (session: Session) => void) => Promise<{ type: 'success' | 'error'; text: string } | null>;
  handleUpdatePassword: (e: React.FormEvent, email?: string) => Promise<{ type: 'success' | 'error'; text: string } | null>;
  resetPasswordForm: () => void;
}

/**
 * Custom hook for managing account settings
 * Handles account updates and password changes
 */
export function useAccountSettings(initialName = '', initialEmail = ''): UseAccountSettingsReturn {
  const [accountForm, setAccountForm] = useState<AccountFormData>({
    name: initialName,
    email: initialEmail,
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetPasswordForm = useCallback(() => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, []);

  const handleUpdateAccount = useCallback(async (
    e: React.FormEvent,
    session: Session | null,
    onSuccess: (session: Session) => void
  ): Promise<{ type: 'success' | 'error'; text: string } | null> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/settings/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm),
      });

      const data = await response.json();

      if (data.success) {
        if (session) {
          const updatedSession = { ...session, ...accountForm };
          localStorage.setItem('session', JSON.stringify(updatedSession));
          onSuccess(updatedSession);
        }
        return { type: 'success', text: 'Account updated successfully' };
      } else {
        return { type: 'error', text: data.error || 'Failed to update account' };
      }
    } catch (error) {
      return { type: 'error', text: 'Failed to update account' };
    } finally {
      setIsSubmitting(false);
    }
  }, [accountForm]);

  const handleUpdatePassword = useCallback(async (
    e: React.FormEvent,
    email?: string
  ): Promise<{ type: 'success' | 'error'; text: string } | null> => {
    e.preventDefault();
    setIsSubmitting(true);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setIsSubmitting(false);
      return { type: 'error', text: 'New passwords do not match' };
    }

    try {
      const response = await fetchWithAuth('/api/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        resetPasswordForm();
        return { type: 'success', text: 'Password updated successfully' };
      } else {
        return { type: 'error', text: data.error || 'Failed to update password' };
      }
    } catch (error) {
      return { type: 'error', text: 'Failed to update password' };
    } finally {
      setIsSubmitting(false);
    }
  }, [passwordForm, resetPasswordForm]);

  return {
    accountForm,
    setAccountForm,
    passwordForm,
    setPasswordForm,
    isSubmitting,
    handleUpdateAccount,
    handleUpdatePassword,
    resetPasswordForm,
  };
}
