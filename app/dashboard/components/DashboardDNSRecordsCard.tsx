import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { type DNSRecord } from '../hooks/useDashboardData';

interface DashboardDNSRecordsCardProps {
  records: DNSRecord[];
}

export default function DashboardDNSRecordsCard({ records }: DashboardDNSRecordsCardProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <Card
        title="DNS Records"
        subtitle={`${records.length} A/AAAA record${records.length !== 1 ? 's' : ''}`}
        className="flex-1 flex flex-col"
      >
        {records.length === 0 ? (
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  No DNS records found
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/zones')}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2 mt-auto"
            >
              Manage DNS records
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="space-y-1.5 flex-1">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors truncate"
                  title={`${record.type} - ${record.name} - ${record.content}`}
                >
                  <span
                    className={`font-semibold ${
                      record.type === 'A'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    {record.type}
                  </span>
                  <span className="text-gray-400 dark:text-gray-600 mx-1.5">-</span>
                  <span className="text-gray-900 dark:text-white">{record.name}</span>
                  <span className="text-gray-400 dark:text-gray-600 mx-1.5">-</span>
                  <span className="text-gray-600 dark:text-gray-400">{record.content}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/zones')}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2 mt-3"
            >
              View all DNS records
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
