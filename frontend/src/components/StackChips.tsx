import React from 'react';

interface StackChipsProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (chip: string) => void;
}

export const StackChips: React.FC<StackChipsProps> = ({
  label,
  options,
  selected,
  onToggle,
}) => {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="overflow-x-auto pb-1 -mx-1">
        <div className="flex flex-nowrap gap-2 min-w-0 px-1">
          {options.map((chip) => {
            const isOn = selected.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onToggle(chip)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isOn
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
