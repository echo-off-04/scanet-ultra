'use client';

import { Mail, Phone, Building2, Star } from 'lucide-react';
import type { Contact } from '@/types';

interface ContactsPhotoViewProps {
    contacts: Contact[];
    onContactClick: (contact: Contact) => void;
}

export function ContactsPhotoView({ contacts, onContactClick }: ContactsPhotoViewProps) {
    if (contacts.length === 0) {
        return <div className="rounded-xl border border-slate-200 bg-white py-12 text-center"><p className="font-medium text-slate-500">Aucun contact trouvé</p></div>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6 lg:gap-8">
            {contacts.map((contact) => (
                <button key={contact.id} onClick={() => onContactClick(contact)} className="group flex flex-col items-center rounded-2xl p-2 text-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                    <div className="relative mb-3">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-200 text-xl font-semibold text-slate-900 sm:h-24 sm:w-24 sm:text-2xl">
                            {contact.avatar_url ? <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" /> : contact.full_name.charAt(0).toUpperCase()}
                        </div>
                        {contact.rating && contact.rating > 0 && (
                            <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-slate-200 bg-white px-2.5 py-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs font-semibold text-slate-700">{contact.rating}</span>
                            </div>
                        )}
                    </div>
                    <div className="w-full px-1">
                        <h3 className="mb-1 line-clamp-2 text-xs font-semibold text-slate-900 transition-colors group-hover:text-slate-700 sm:text-sm">{contact.full_name}</h3>
                        {contact.job_title && <p className="mb-1 hidden line-clamp-1 text-xs text-slate-500 sm:block">{contact.job_title}</p>}
                        {contact.company && (
                            <div className="mb-2 hidden items-center justify-center gap-1 text-xs text-slate-600 sm:flex"><Building2 className="h-3 w-3" /><span className="line-clamp-1">{contact.company}</span></div>
                        )}
                        <div className="hidden items-center justify-center gap-2 text-slate-400 sm:flex">
                            {contact.email && <Mail className="h-3.5 w-3.5" />}
                            {contact.phone && <Phone className="h-3.5 w-3.5" />}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
