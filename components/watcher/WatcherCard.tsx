import { Watcher } from '@/app/watcher/hooks/useWatchers';

interface WatcherCardProps {
  watcher: Watcher;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}

export default function WatcherCard({ watcher, onToggle, onDelete }: WatcherCardProps) {
  return (
    <div
      className={`p-4 border-2 rounded-lg ${
        watcher.status === 'ok'
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
          : watcher.status === 'mismatch'
          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {watcher.recordType}
            </span>
            <p className="font-medium text-gray-900 dark:text-white font-mono">
              {watcher.recordName}
            </p>
          </div>

          {watcher.status && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current DNS IP</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {watcher.currentIP || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Server IP</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {watcher.expectedIP || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {watcher.lastChecked && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last checked: {new Date(watcher.lastChecked).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {watcher.status === 'ok' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              ✓ Match
            </span>
          )}
          {watcher.status === 'mismatch' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
              ⚠ Mismatch
            </span>
          )}
          {watcher.status === 'error' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              Error
            </span>
          )}

          <button
            onClick={() => onToggle(watcher.id, !watcher.enabled)}
            className={`p-2 rounded-lg transition-colors ${
              watcher.enabled
                ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={watcher.enabled ? 'Disable' : 'Enable'}
          >
            {watcher.enabled ? (
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>

          <button
            onClick={() => onDelete(watcher.id)}
            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
