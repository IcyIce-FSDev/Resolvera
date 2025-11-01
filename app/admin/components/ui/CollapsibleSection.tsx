import { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  masterChecked: boolean;
  onMasterChange: (checked: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  subtitle,
  isExpanded,
  onToggle,
  masterChecked,
  onMasterChange,
  disabled = false,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      {/* Master Control */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onToggle}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={masterChecked}
            onChange={(e) => {
              onMasterChange(e.target.checked);
              if (e.target.checked && !isExpanded) {
                onToggle();
              }
            }}
            className="sr-only peer"
            disabled={disabled}
          />
          <span className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></span>
        </label>
      </div>

      {/* Sub-options */}
      {isExpanded && (
        <div className="space-y-3 ml-8 pt-3 border-t border-gray-200 dark:border-gray-600">
          {children}
        </div>
      )}
    </div>
  );
}
