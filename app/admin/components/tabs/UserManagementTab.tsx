import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { User, Zone } from '@/app/admin/types';

interface UserManagementTabProps {
  users: User[];
  zones: Zone[];
  sessionUserId?: string;

  // Add user state
  showAddUser: boolean;
  setShowAddUser: (show: boolean) => void;
  newUserName: string;
  setNewUserName: (name: string) => void;
  newUserEmail: string;
  setNewUserEmail: (email: string) => void;
  newUserPassword: string;
  setNewUserPassword: (password: string) => void;
  newUserRole: 'admin' | 'user';
  setNewUserRole: (role: 'admin' | 'user') => void;
  newUserZones: string[];

  // Edit user state
  editingUser: User | null;
  setEditingUser: (user: User | null) => void;

  // Actions
  handleAddUser: (e: React.FormEvent) => Promise<void>;
  handleUpdateUser: (e: React.FormEvent) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  toggleZoneAssignment: (zoneId: string, isEditing?: boolean) => void;

  isSubmitting: boolean;
}

export default function UserManagementTab({
  users,
  zones,
  sessionUserId,
  showAddUser,
  setShowAddUser,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  newUserRole,
  setNewUserRole,
  newUserZones,
  editingUser,
  setEditingUser,
  handleAddUser,
  handleUpdateUser,
  handleDeleteUser,
  toggleZoneAssignment,
  isSubmitting,
}: UserManagementTabProps) {
  return (
    <Card
      title="Manage Users"
      headerAction={
        <Button
          variant="primary"
          onClick={() => {
            setShowAddUser(!showAddUser);
            setEditingUser(null);
          }}
        >
          {showAddUser ? 'Cancel' : 'Add User'}
        </Button>
      }
    >
      {/* Add User Form */}
      {showAddUser && (
        <form onSubmit={handleAddUser} className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assigned Zones
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto">
              {zones.map((zone) => (
                <label key={zone.zoneId} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={newUserZones.includes(zone.zoneId)}
                    onChange={() => toggleZoneAssignment(zone.zoneId)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{zone.zoneName}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty to grant access to all zones
            </p>
          </div>

          <Button
            type="submit"
            variant="success"
            isLoading={isSubmitting}
          >
            Create User
          </Button>
        </form>
      )}

      {/* Edit User Form */}
      {editingUser && (
        <form onSubmit={handleUpdateUser} className="mb-6 p-4 border border-blue-200 dark:border-blue-700 rounded-lg space-y-4 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="font-semibold text-gray-900 dark:text-white">Edit User: {editingUser.email}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={editingUser.role}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'user' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assigned Zones
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto">
              {zones.map((zone) => (
                <label key={zone.zoneId} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={editingUser.assignedZoneIds?.includes(zone.zoneId) || false}
                    onChange={() => toggleZoneAssignment(zone.zoneId, true)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{zone.zoneName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Zones: {user.assignedZoneIds?.length > 0 ? user.assignedZoneIds.length : 'All'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingUser(user);
                  setShowAddUser(false);
                }}
              >
                Edit
              </Button>
              {user.id !== sessionUserId && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
                  isLoading={isSubmitting}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No users found.
          </p>
        )}
      </div>
    </Card>
  );
}
