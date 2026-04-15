'use client';

import { Mail, Phone, Building2, MapPin, Star } from 'lucide-react';
import type { Contact } from '@/types';

interface ContactsListViewProps {
    contacts: Contact[];
    onContactClick: (contact: Contact) => void;
}

export function ContactsListView({ contacts, onContactClick }: ContactsListViewProps) {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            lead: 'bg-slate-100 text-slate-700', prospect: 'bg-slate-100 text-slate-700',
            client: 'bg-slate-100 text-slate-700', partner: 'bg-slate-100 text-slate-700',
            collaborateur: 'bg-slate-100 text-slate-700', ami: 'bg-slate-100 text-slate-700',
            fournisseur: 'bg-slate-100 text-slate-700',
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            lead: 'Lead', prospect: 'Prospect', client: 'Client', partner: 'Partenaire',
            collaborateur: 'Collaborateur', ami: 'Ami(e)', fournisseur: 'Fournisseur',
        };
        return labels[status] || status;
    };

    return (
        <>
            {/* Mobile */}
            <div className="lg:hidden space-y-4">
                {contacts.map((contact) => (
                    <div key={contact.id} onClick={() => onContactClick(contact)} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-200 text-sm font-semibold text-slate-900">
                                {contact.avatar_url ? <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" /> : contact.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="truncate font-semibold text-slate-900">{contact.full_name}</h3>
                                        {contact.job_title && <p className="truncate text-sm text-slate-500">{contact.job_title}</p>}
                                    </div>
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(contact.status || 'lead')}`}>
                                        {getStatusLabel(contact.status || 'lead')}
                                    </span>
                                </div>
                                {contact.company && (
                                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-700"><Building2 className="h-4 w-4 text-slate-400" /><span className="truncate">{contact.company}</span></div>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                                    {contact.email && <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" /><span className="truncate">{contact.email}</span></div>}
                                    {contact.phone && <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /><span>{contact.phone}</span></div>}
                                    {(contact.city || contact.country) && <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /><span className="truncate">{[contact.city, contact.country].filter(Boolean).join(', ')}</span></div>}
                                </div>
                                {contact.rating && contact.rating > 0 && (
                                    <div className="flex gap-0.5 mt-2">
                                        {[...Array(5)].map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < contact.rating! ? 'fill-amber-400 text-amber-400' : 'fill-slate-300 text-slate-300'}`} />)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Nom</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Entreprise</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Localisation</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Statut</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {contacts.map((contact) => (
                                <tr key={contact.id} onClick={() => onContactClick(contact)} className="cursor-pointer transition-colors hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-200 text-sm font-semibold text-slate-900">
                                                {contact.avatar_url ? <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" /> : contact.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{contact.full_name}</div>
                                                {contact.job_title && <div className="text-sm text-slate-500">{contact.job_title}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{contact.company ? <div className="flex items-center gap-2 text-slate-700"><Building2 className="h-4 w-4 text-slate-400" /><span className="text-sm">{contact.company}</span></div> : <span className="text-sm text-slate-400">-</span>}</td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {contact.email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="h-4 w-4 text-slate-400" /><span className="max-w-[200px] truncate">{contact.email}</span></div>}
                                            {contact.phone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="h-4 w-4 text-slate-400" /><span>{contact.phone}</span></div>}
                                            {!contact.email && !contact.phone && <span className="text-sm text-slate-400">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{contact.city || contact.country ? <div className="flex items-center gap-2 text-sm text-slate-700"><MapPin className="h-4 w-4 text-slate-400" /><span>{[contact.city, contact.country].filter(Boolean).join(', ')}</span></div> : <span className="text-sm text-slate-400">-</span>}</td>
                                    <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contact.status || 'lead')}`}>{getStatusLabel(contact.status || 'lead')}</span></td>
                                    <td className="px-6 py-4">{contact.rating ? <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < contact.rating! ? 'fill-amber-400 text-amber-400' : 'fill-slate-300 text-slate-300'}`} />)}</div> : <span className="text-sm text-slate-400">-</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
