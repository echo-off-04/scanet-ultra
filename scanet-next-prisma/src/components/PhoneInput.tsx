'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRIES, Country, getCountryByCode } from '@/lib/countries';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    defaultCountryCode?: string;
    className?: string;
    placeholder?: string;
}

export function PhoneInput({
    value,
    onChange,
    defaultCountryCode = 'FR',
    className = '',
    placeholder,
}: PhoneInputProps) {
    const [selectedCountry, setSelectedCountry] = useState<Country>(
        getCountryByCode(defaultCountryCode) || COUNTRIES[0]
    );
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [localNumber, setLocalNumber] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            for (const country of COUNTRIES) {
                const dialCode = country.dialCode.replace('+', '');
                if (value.startsWith('+' + dialCode)) {
                    setSelectedCountry(country);
                    setLocalNumber(value.slice(country.dialCode.length));
                    return;
                } else if (value.startsWith(dialCode)) {
                    setSelectedCountry(country);
                    setLocalNumber(value.slice(dialCode.length));
                    return;
                }
            }
            setLocalNumber(value);
        }
    }, []);

    useEffect(() => {
        const defaultCountry = getCountryByCode(defaultCountryCode);
        if (defaultCountry && !value) {
            setSelectedCountry(defaultCountry);
        }
    }, [defaultCountryCode, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = COUNTRIES.filter(
        country =>
            country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            country.dialCode.includes(searchQuery)
    );

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearchQuery('');
        if (localNumber) {
            onChange(`${country.dialCode}${localNumber}`);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const digitsOnly = input.replace(/\D/g, '');
        const maxLength = selectedCountry.maxLength || 15;
        const limitedDigits = digitsOnly.slice(0, maxLength);
        setLocalNumber(limitedDigits);
        const fullNumber = limitedDigits ? `${selectedCountry.dialCode}${limitedDigits}` : '';
        onChange(fullNumber);
    };

    const formatPhoneNumber = (phoneNumber: string): string => {
        if (!phoneNumber) return '';
        const format = selectedCountry.format || 'X'.repeat(phoneNumber.length);
        let formatted = '';
        let phoneIndex = 0;
        for (let i = 0; i < format.length && phoneIndex < phoneNumber.length; i++) {
            if (format[i] === 'X') {
                formatted += phoneNumber[phoneIndex];
                phoneIndex++;
            } else {
                formatted += format[i];
            }
        }
        if (phoneIndex < phoneNumber.length) {
            formatted += phoneNumber.slice(phoneIndex);
        }
        return formatted;
    };

    return (
        <div className={`relative ${className}`}>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => { setIsOpen(false); setSearchQuery(''); }} />
            )}
            <div className="flex gap-2">
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                    >
                        <span className="text-lg sm:text-xl">{selectedCountry.flag}</span>
                        <span className="text-gray-900 font-medium text-xs sm:text-sm">{selectedCountry.dialCode}</span>
                        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                        <div className="fixed sm:absolute top-1/2 left-1/2 sm:top-full sm:left-0 -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0 sm:mt-2 w-[90vw] max-w-sm sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                            <div className="p-3 border-b border-gray-200">
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un pays..." className="w-full px-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" autoFocus />
                            </div>
                            <div className="max-h-64 sm:max-h-64 overflow-y-auto custom-scrollbar">
                                {filteredCountries.map((country) => (
                                    <button key={country.code} type="button" onClick={() => handleCountrySelect(country)} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${selectedCountry.code === country.code ? 'bg-blue-100' : ''}`}>
                                        <span className="text-xl sm:text-2xl">{country.flag}</span>
                                        <span className="flex-1 text-gray-900 font-medium text-sm sm:text-base">{country.name}</span>
                                        <span className="text-gray-600 text-xs sm:text-sm">{country.dialCode}</span>
                                    </button>
                                ))}
                                {filteredCountries.length === 0 && <div className="px-4 py-6 text-center text-gray-500">Aucun pays trouvé</div>}
                            </div>
                        </div>
                    )}
                </div>
                <input
                    type="tel"
                    value={formatPhoneNumber(localNumber)}
                    onChange={handlePhoneChange}
                    placeholder={placeholder || selectedCountry.format || `${selectedCountry.maxLength || 10} chiffres`}
                    maxLength={selectedCountry.maxLength ? (selectedCountry.format?.length || selectedCountry.maxLength + 5) : undefined}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400 text-gray-900 transition-all"
                />
            </div>
            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
        </div>
    );
}
