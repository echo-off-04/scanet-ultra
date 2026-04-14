'use client';

import type { Contact } from '@/types';
import { Star } from 'lucide-react';

interface FavoriteContactsBarProps {
    contacts: Contact[];
    onContactClick: (contact: Contact) => void;
}

export function FavoriteContactsBar({ contacts, onContactClick }: FavoriteContactsBarProps) {
    const recentContacts = contacts.slice(0, 4);
    const remainingCount = Math.max(0, contacts.length - 4);

    if (contacts.length === 0) return null;

    return (
        <div className="flex items-center gap-3 py-3 px-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 overflow-x-auto scrollbar-hide">
            <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <div className="flex items-center gap-2">
                {recentContacts.map((contact) => (
                    <button
                        key={contact.id}
                        onClick={() => onContactClick(contact)}
                        className="relative flex-shrink-0 group"
                        title={contact.full_name}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1E5A8E] flex items-center justify-center text-white text-sm font-bold ring-2 ring-white group-hover:ring-[#0E3A5D] transition-all">
                            {contact.avatar_url ? (
                                <img src={contact.avatar_url} alt={contact.full_name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                contact.full_name?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                    </button>
                ))}
                {remainingCount > 0 && (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                        +{remainingCount}
                    </div>
                )}
            </div>
        </div>
    );
}
