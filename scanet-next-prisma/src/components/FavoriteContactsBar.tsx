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
        <div className="flex items-center gap-3 overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3 scrollbar-hide">
            <Star className="h-4 w-4 flex-shrink-0 text-slate-500" />
            <div className="flex items-center gap-2">
                {recentContacts.map((contact) => (
                    <button
                        key={contact.id}
                        onClick={() => onContactClick(contact)}
                        className="relative flex-shrink-0 group"
                        title={contact.full_name}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-sm font-semibold text-slate-900 transition-colors group-hover:bg-slate-100">
                            {contact.avatar_url ? (
                                <img src={contact.avatar_url} alt={contact.full_name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                contact.full_name?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
                    </button>
                ))}
                {remainingCount > 0 && (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600">
                        +{remainingCount}
                    </div>
                )}
            </div>
        </div>
    );
}
