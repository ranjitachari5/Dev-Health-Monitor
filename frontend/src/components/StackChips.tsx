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
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(96,165,250,0.5)' }}>
        {label}
      </p>
      <div className="overflow-x-auto pb-1 -mx-1">
        <div className="flex flex-wrap gap-2 px-1">
          {options.map((chip) => {
            const isOn = selected.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onToggle(chip)}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 chip-btn"
                style={isOn ? {
                  background: 'linear-gradient(135deg,rgba(37,99,235,0.5),rgba(124,58,237,0.3))',
                  border: '1px solid rgba(96,165,250,0.55)',
                  color: '#e0f2fe',
                  boxShadow: '0 0 14px rgba(59,130,246,0.25)',
                } : {
                  background: 'rgba(8,8,32,0.7)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  color: 'rgba(148,163,184,0.8)',
                }}
                data-hover
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
