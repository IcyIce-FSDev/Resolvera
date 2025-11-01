interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  color?: 'blue' | 'purple' | 'emerald' | 'amber';
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  color = 'blue',
}: ToggleSwitchProps) {
  const colorClasses = {
    blue: 'peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800',
    purple: 'peer-checked:bg-purple-500 dark:peer-checked:bg-purple-600 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800',
    emerald: 'peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800',
    amber: 'peer-checked:bg-amber-500 dark:peer-checked:bg-amber-600 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800',
  };

  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div>
          {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
          {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
      )}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          disabled={disabled}
        />
        <span
          className={`w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 rounded-full ${colorClasses[color]} after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white`}
        ></span>
      </label>
    </div>
  );
}
