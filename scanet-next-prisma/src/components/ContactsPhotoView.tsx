'use client';

import { Mail, Phone, Building2, Star } from 'lucide-react';
import type { Contact } from '@/types';

interface ContactsPhotoViewProps {
    contacts: Contact[];
    onContactClick: (contact: Contact) => void;
}

export function ContactsPhotoView({ contacts, onContactClick }: ContactsPhotoViewProps) {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            lead: 'from-orange-500 to-orange-700', prospect: 'from-blue-500 to-blue-700',
            client: 'from-emerald-500 to-emerald-700', partner: 'from-purple-500 to-purple-700',
            collaborateur: 'from-cyan-500 to-cyan-700', ami: 'from-pink-500 to-pink-700',
            fournisseur: 'from-amber-500 to-amber-700',
        };
        return colors[status] || 'from-gray-500 to-gray-700';
    };

    if (contacts.length === 0) {
        return <div className="text-center py-12 glass-card"><p className="text-gray-500 font-medium">Aucun contact trouvé</p></div>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6 lg:gap-8">
            {contacts.map((contact) => (
                <button key={contact.id} onClick={() => onContactClick(contact)} className="group flex flex-col items-center text-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded-2xl p-2">
                    <div className="relative mb-3">
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${getStatusColor(contact.status || 'lead')} flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg group-hover:shadow-2xl transition-all overflow-hidden ring-4 ring-white/50 group-hover:ring-white/80`}>
                            {contact.avatar_url ? <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" /> : contact.full_name.charAt(0).toUpperCase()}
                        </div>
                        {contact.rating && contact.rating > 0 && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-lg flex items-center gap-0.5 border border-white/60">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /><span className="text-xs font-bold text-gray-700">{contact.rating}</span>
                            </div>
                        )}
                    </div>
                    <div className="w-full px-1">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">{contact.full_name}</h3>
                        {contact.job_title && <p className="text-xs text-gray-500 mb-1 line-clamp-1 hidden sm:block">{contact.job_title}</p>}
                        {contact.company && (
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-2 hidden sm:flex"><Building2 className="w-3 h-3" /><span className="line-clamp-1">{contact.company}</span></div>
                        )}
                        <div className="flex items-center justify-center gap-2 text-gray-400 hidden sm:flex">
                            {contact.email && <Mail className="w-3.5 h-3.5" />}
                            {contact.phone && <Phone className="w-3.5 h-3.5" />}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
