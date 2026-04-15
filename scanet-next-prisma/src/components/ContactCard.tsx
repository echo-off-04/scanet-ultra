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
        lead: 'bg-slate-100 text-slate-700',
        prospect: 'bg-slate-100 text-slate-700',
        client: 'bg-slate-100 text-slate-700',
        partner: 'bg-slate-100 text-slate-700',
        collaborateur: 'bg-slate-100 text-slate-700',
        ami: 'bg-slate-100 text-slate-700',
        fournisseur: 'bg-slate-100 text-slate-700',
    };

    const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50" onClick={onClick}>
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                    {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt={contact.full_name} className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-lg font-semibold text-slate-900">
                            {getInitials(contact.full_name)}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="truncate text-lg font-semibold text-slate-900">{contact.full_name}</h3>
                    </div>
                    {contact.job_title && <p className="mb-2 truncate text-sm text-slate-600">{contact.job_title}</p>}
                    {contact.rating && contact.rating > 0 && (
                        <div className="flex gap-0.5 mb-2">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className={`h-3.5 w-3.5 ${i < contact.rating! ? 'fill-amber-400 text-amber-400' : 'fill-slate-300 text-slate-300'}`} />
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {contact.status && (
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[contact.status] || 'bg-slate-100 text-slate-700'}`}>
                                {contact.status}
                            </span>
                        )}
                        {contact.source && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{contact.source}</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                    {contact.email && (
                        <div className="flex items-center gap-1.5"><Mail className="h-4 w-4" /><span className="max-w-[150px] truncate">{contact.email}</span></div>
                    )}
                    {contact.phone && (
                        <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" /><span>{contact.phone}</span></div>
                    )}
                    {contact.company && (
                        <div className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /><span className="max-w-[150px] truncate">{contact.company}</span></div>
                    )}
                </div>
            </div>
        </div>
    );
}
