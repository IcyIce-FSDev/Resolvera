import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { type AccountFormData, type PasswordFormData } from '../hooks/useAccountSettings';

interface SettingsAccountTabProps {
  accountForm: AccountFormData;
  passwordForm: PasswordFormData;
  isSubmitting: boolean;
  onAccountChange: (field: keyof AccountFormData, value: string) => void;
  onPasswordChange: (field: keyof PasswordFormData, value: string) => void;
  onUpdateAccount: (e: React.FormEvent) => void;
  onUpdatePassword: (e: React.FormEvent) => void;
}

export default function SettingsAccountTab({
  accountForm,
  passwordForm,
  isSubmitting,
  onAccountChange,
  onPasswordChange,
  onUpdateAccount,
  onUpdatePassword,
}: SettingsAccountTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Information Card */}
      <Card title="Profile Information">
        <form onSubmit={onUpdateAccount} className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={accountForm.name}
            onChange={(e) => onAccountChange('name', e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={accountForm.email}
            onChange={(e) => onAccountChange('email', e.target.value)}
            required
          />
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Change Password Card */}
      <Card title="Change Password">
        <form onSubmit={onUpdatePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => onPasswordChange('newPassword', e.target.value)}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
            required
          />
          <Button type="submit" isLoading={isSubmitting}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
