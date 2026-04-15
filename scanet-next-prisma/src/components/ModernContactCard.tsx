'use client';

import { Star, Send, Building2, MapPin } from 'lucide-react';
import type { Contact } from '@/types';
import { MaterialIconButton } from './material/MaterialIconButton';

interface ModernContactCardProps {
    contact: Contact;
    onClick: (contact: Contact) => void;
}

export function ModernContactCard({ contact, onClick }: ModernContactCardProps) {
    const statusColors: Record<string, string> = {
        lead: 'bg-blue-100 text-blue-700',
        prospect: 'bg-amber-100 text-amber-700',
        client: 'bg-emerald-100 text-emerald-700',
        partner: 'bg-purple-100 text-purple-700',
    };

    const statusLabels: Record<string, string> = {
        lead: 'Lead',
        prospect: 'Prospect',
        client: 'Client',
        partner: 'Partenaire',
    };

    return (
        <div
            onClick={() => onClick(contact)}
            className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-lg font-semibold text-slate-900">
                    {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt={contact.full_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        contact.full_name?.[0]?.toUpperCase() || '?'
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-slate-900">{contact.full_name}</h3>
                        {contact.is_favorite && <Star className="h-4 w-4 flex-shrink-0 fill-amber-400 text-amber-400" />}
                    </div>
                    {contact.company && (
                        <p className="flex items-center gap-1 truncate text-sm text-slate-500">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            {contact.company}
                        </p>
                    )}
                    {contact.city && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {contact.city}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        {contact.status && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[contact.status] || 'bg-slate-100 text-slate-700'}`}>
                                {statusLabels[contact.status] || contact.status}
                            </span>
                        )}
                        {contact.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="max-w-[80px] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <MaterialIconButton
                    ariaLabel="Envoyer un email"
                    onClick={(e) => { e.stopPropagation(); if (contact.email) window.location.href = `mailto:${contact.email}`; }}
                    icon={<Send className="h-4 w-4" />}
                    className="opacity-0 transition-all group-hover:opacity-100"
                />
            </div>
        </div>
    );
}
