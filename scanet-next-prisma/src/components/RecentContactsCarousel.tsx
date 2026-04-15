'use client';

import type { Contact } from '@/types';

interface RecentContactsCarouselProps {
    contacts: Contact[];
    onContactClick?: (contact: Contact) => void;
}

export function RecentContactsCarousel({ contacts, onContactClick }: RecentContactsCarouselProps) {
    const recentContacts = contacts.slice(0, 10);

    if (recentContacts.length === 0) return null;

    const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
            <div className="-mx-2 flex items-center gap-3 overflow-x-auto px-2 pb-0 scrollbar-hide lg:gap-4">
                {recentContacts.map((contact) => (
                    <button
                        key={contact.id}
                        onClick={() => onContactClick?.(contact)}
                        className="group relative flex-shrink-0 cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                        title={contact.full_name}
                    >
                        <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100 text-slate-900 transition-transform duration-200 group-hover:scale-105 sm:h-14 sm:w-14 lg:h-16 lg:w-16">
                                {contact.avatar_url ? (
                                    <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-semibold sm:text-sm lg:text-base">{getInitials(contact.full_name)}</span>
                                )}
                            </div>
                            <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400 sm:h-3.5 sm:w-3.5" />
                        </div>
                    </button>
                ))}
                {contacts.length > recentContacts.length && (
                    <div className="ml-2 flex-shrink-0 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 lg:px-5 lg:py-2.5 lg:text-sm">
                        +{contacts.length - recentContacts.length}
                    </div>
                )}
            </div>
        </div>
    );
}
