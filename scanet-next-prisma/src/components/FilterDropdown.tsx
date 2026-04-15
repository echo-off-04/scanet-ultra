'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface FilterDropdownProps {
    label: string;
    options: { value: string; label: string }[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
}

export function FilterDropdown({ label, options, selectedValues, onChange, placeholder = 'Sélectionner...' }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((v) => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const displayText = selectedValues.length === 0
        ? placeholder
        : selectedValues.length === 1
            ? options.find(opt => opt.value === selectedValues[0])?.label || placeholder
            : `${selectedValues.length} sélectionné(s)`;

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="input-modern flex w-full items-center justify-between px-4 py-2.5 text-left hover:border-slate-300"
            >
                <span className={selectedValues.length === 0 ? 'text-slate-500' : 'text-slate-900'}>{displayText}</span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    {options.length === 0 ? (
                        <div className="px-4 py-3 text-center text-sm text-slate-500">Aucune option disponible</div>
                    ) : (
                        <div className="py-2">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleOption(option.value)}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                                >
                                    <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selectedValues.includes(option.value) ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                                        {selectedValues.includes(option.value) && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                                    </div>
                                    <span className="text-sm text-slate-900">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
