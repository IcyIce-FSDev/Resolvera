import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { getLogSeverityColor } from '@/lib/ui/statusColors';
import { type AuditLog } from '../hooks/useDashboardData';

interface DashboardAuditLogsCardProps {
  logs: AuditLog[];
}

export default function DashboardAuditLogsCard({ logs }: DashboardAuditLogsCardProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <Card
        title="Recent Activity"
        subtitle="Last 5 audit log entries"
        className="flex-1 flex flex-col"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No recent activity
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="space-y-2.5 flex-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getLogSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                      {log.success !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                            log.success
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                    {log.action}
                    {log.resource && (
                      <span className="ml-1.5 font-normal text-gray-600 dark:text-gray-400">
                        on {log.resource}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {log.userName || 'Unknown'} ({log.userEmail || 'N/A'})
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2 mt-3"
            >
              View all activity logs
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
