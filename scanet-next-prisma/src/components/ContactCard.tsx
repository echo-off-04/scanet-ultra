'use client';

import { Star, Mail, Phone, Building2 } from 'lucide-react';
import type { Contact } from '@/types';

interface ContactCardProps {
    contact: Contact;
    onClick: () => void;
    onSendOffer?: (contact: Contact) => void;
}

export function ContactCard({ contact, onClick, onSendOffer }: ContactCardProps) {
    const statusColors: Record<string, string> = {
        lead: 'bg-orange-100 text-orange-700',
        prospect: 'bg-amber-100 text-amber-700',
        client: 'bg-emerald-100 text-emerald-700',
        partner: 'bg-violet-100 text-violet-700',
        collaborateur: 'bg-cyan-100 text-cyan-700',
        ami: 'bg-pink-100 text-pink-700',
        fournisseur: 'bg-amber-100 text-amber-700',
    };

    const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="glass-card p-5 cursor-pointer group" onClick={onClick}>
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                    {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt={contact.full_name} className="w-16 h-16 rounded-full object-cover ring-2 ring-white/50 shadow-lg" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold ring-2 ring-white/50 shadow-lg">
                            {getInitials(contact.full_name)}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg truncate">{contact.full_name}</h3>
                    </div>
                    {contact.job_title && <p className="text-sm text-gray-600 truncate mb-2">{contact.job_title}</p>}
                    {contact.rating && contact.rating > 0 && (
                        <div className="flex gap-0.5 mb-2">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < contact.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`} />
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {contact.status && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[contact.status] || 'bg-gray-100 text-gray-700'}`}>
                                {contact.status}
                            </span>
                        )}
                        {contact.source && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{contact.source}</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    {contact.email && (
                        <div className="flex items-center gap-1.5"><Mail className="w-4 h-4" /><span className="truncate max-w-[150px]">{contact.email}</span></div>
                    )}
                    {contact.phone && (
                        <div className="flex items-center gap-1.5"><Phone className="w-4 h-4" /><span>{contact.phone}</span></div>
                    )}
                    {contact.company && (
                        <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /><span className="truncate max-w-[150px]">{contact.company}</span></div>
                    )}
                </div>
            </div>
        </div>
    );
}
