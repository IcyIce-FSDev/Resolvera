import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Zone {
  zoneName: string;
  zoneId: string;
  apiToken: string;
}

interface ZonesTabProps {
  zones: Zone[];
  showAddZone: boolean;
  newZoneName: string;
  newZoneId: string;
  newApiToken: string;
  isSubmitting: boolean;
  setShowAddZone: (show: boolean) => void;
  setNewZoneName: (name: string) => void;
  setNewZoneId: (id: string) => void;
  setNewApiToken: (token: string) => void;
  handleAddZone: (e: React.FormEvent) => Promise<void>;
  handleDeleteZone: (zoneId: string) => Promise<void>;
}

export default function ZonesTab({
  zones,
  showAddZone,
  newZoneName,
  newZoneId,
  newApiToken,
  isSubmitting,
  setShowAddZone,
  setNewZoneName,
  setNewZoneId,
  setNewApiToken,
  handleAddZone,
  handleDeleteZone,
}: ZonesTabProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manage Zones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure Cloudflare zones for DNS management
            </p>
          </div>
          <Button onClick={() => setShowAddZone(!showAddZone)} size="sm">
            {showAddZone ? 'Cancel' : 'Add Zone'}
          </Button>
        </div>
      </div>

      <div className="p-6">
        {showAddZone && (
          <form
            onSubmit={handleAddZone}
            className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4 bg-gray-50 dark:bg-gray-900/50"
          >
            <Input
              label="Zone Name"
              type="text"
              placeholder="example.com"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              required
            />
            <Input
              label="Zone ID"
              type="text"
              placeholder="Enter Cloudflare Zone ID"
              value={newZoneId}
              onChange={(e) => setNewZoneId(e.target.value)}
              required
            />
            <Input
              label="API Token"
              type="password"
              placeholder="Enter Cloudflare API Token"
              value={newApiToken}
              onChange={(e) => setNewApiToken(e.target.value)}
              required
            />
            <Button type="submit" variant="success" isLoading={isSubmitting}>
              Add Zone
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.zoneId}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {zone.zoneName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  ID: {zone.zoneId}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteZone(zone.zoneId)}
                disabled={isSubmitting}
              >
                Remove
              </Button>
            </div>
          ))}
          {zones.length === 0 && (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No zones configured. Add a zone to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
