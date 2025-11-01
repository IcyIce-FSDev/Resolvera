import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { getWatcherStatusColor, getWatcherDotColor } from '@/lib/ui/statusColors';
import { type Watcher } from '../hooks/useDashboardData';

interface DashboardWatchersCardProps {
  watchers: Watcher[];
}

export default function DashboardWatchersCard({ watchers }: DashboardWatchersCardProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <Card
        title="DNS Watchers"
        subtitle={`${watchers.length} watcher${watchers.length !== 1 ? 's' : ''} configured`}
        className="flex-1 flex flex-col"
      >
        {watchers.length === 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  No watchers configured
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/watcher')}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2 mt-auto"
            >
              Set up your first watcher
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="space-y-3 flex-1">
              {watchers.slice(0, 5).map((watcher) => (
                <div
                  key={watcher.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${getWatcherDotColor(watcher.status)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {watcher.recordName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {watcher.zoneName} • {watcher.recordType}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getWatcherStatusColor(watcher.status)}`}>
                    {watcher.status || 'unknown'}
                  </span>
                </div>
              ))}
            </div>
            {watchers.length > 5 && (
              <button
                onClick={() => router.push('/watcher')}
                className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2 mt-3"
              >
                View all {watchers.length} watchers
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
