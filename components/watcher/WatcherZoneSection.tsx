import { Watcher } from '@/app/watcher/hooks/useWatchers';
import WatcherCard from './WatcherCard';

interface WatcherZoneSectionProps {
  zoneName: string;
  watchers: Watcher[];
  isCollapsed: boolean;
  onToggleCollapse: (zoneName: string) => void;
  onToggleWatcher: (id: string, enabled: boolean) => void;
  onDeleteWatcher: (id: string) => void;
}

export default function WatcherZoneSection({
  zoneName,
  watchers,
  isCollapsed,
  onToggleCollapse,
  onToggleWatcher,
  onDeleteWatcher,
}: WatcherZoneSectionProps) {
  const hasIssues = watchers.some(w => w.status === 'mismatch' || w.status === 'error');
  const mismatchCount = watchers.filter(w => w.status === 'mismatch').length;

  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Zone Header */}
      <button
        onClick={() => onToggleCollapse(zoneName)}
        className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${!isCollapsed ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {zoneName}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({watchers.length} watcher{watchers.length !== 1 ? 's' : ''})
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            • Number of Mismatch: {mismatchCount}
          </span>
          {hasIssues && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
              Issues
            </span>
          )}
        </div>
      </button>

      {/* Zone Watchers */}
      {!isCollapsed && (
        <div className="p-4 space-y-3 bg-white dark:bg-gray-800">
          {watchers.map((watcher) => (
            <WatcherCard
              key={watcher.id}
              watcher={watcher}
              onToggle={onToggleWatcher}
              onDelete={onDeleteWatcher}
            />
          ))}
        </div>
      )}
    </div>
  );
}
