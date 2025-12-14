import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-white/5 border ${isOpen ? 'border-white/20 bg-white/10' : 'border-white/10'} hover:bg-white/10 rounded-xl px-4 py-2.5 text-sm text-white transition-all min-w-[180px] justify-between`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon}
          <span className="font-medium truncate">{selectedLabel}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''} shrink-0`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-full min-w-[180px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/5">
           {label && <div className="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-white/5">{label}</div>}
           <div className="py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
             {options.map((option) => (
               <button
                 key={option.value}
                 onClick={() => {
                   onChange(option.value);
                   setIsOpen(false);
                 }}
                 className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${
                    value === option.value 
                      ? 'bg-indigo-500/10 text-indigo-400 font-bold' 
                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                 }`}
               >
                 <span>{option.label}</span>
                 {value === option.value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
               </button>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};