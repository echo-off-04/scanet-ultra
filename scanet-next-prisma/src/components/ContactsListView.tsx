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
            lead: 'bg-orange-100 text-orange-700', prospect: 'bg-blue-100 text-blue-700',
            client: 'bg-emerald-100 text-emerald-700', partner: 'bg-purple-100 text-purple-700',
            collaborateur: 'bg-cyan-100 text-cyan-700', ami: 'bg-pink-100 text-pink-700',
            fournisseur: 'bg-amber-100 text-amber-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
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
                    <div key={contact.id} onClick={() => onContactClick(contact)} className="glass-card p-5 cursor-pointer">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                                {contact.avatar_url ? <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" /> : contact.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{contact.full_name}</h3>
                                        {contact.job_title && <p className="text-sm text-gray-500 truncate">{contact.job_title}</p>}
                                    </div>
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(contact.status || 'lead')}`}>
                                        {getStatusLabel(contact.status || 'lead')}
                                    </span>
                                </div>
                                {contact.company && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-2"><Building2 className="w-4 h-4 text-gray-400" /><span className="truncate">{contact.company}</span></div>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                    {contact.email && <div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /><span className="truncate">{contact.email}</span></div>}
                                    {contact.phone && <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /><span>{contact.phone}</span></div>}
                                    {(contact.city || contact.country) && <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span className="truncate">{[contact.city, contact.country].filter(Boolean).join(', ')}</span></div>}
                                </div>
                                {contact.rating && contact.rating > 0 && (
                                    <div className="flex gap-0.5 mt-2">
                                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < contact.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/50 backdrop-blur-sm border-b border-gray-200/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entreprise</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Localisation</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contacts.map((contact) => (
                                <tr key={contact.id} onClick={() => onContactClick(contact)} className="hover:bg-white/60 cursor-pointer transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                                                {contact.avatar_url ? <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" /> : contact.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{contact.full_name}</div>
                                                {contact.job_title && <div className="text-sm text-gray-500">{contact.job_title}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{contact.company ? <div className="flex items-center gap-2 text-gray-700"><Building2 className="w-4 h-4 text-gray-400" /><span className="text-sm">{contact.company}</span></div> : <span className="text-sm text-gray-400">-</span>}</td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {contact.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="w-4 h-4 text-gray-400" /><span className="truncate max-w-[200px]">{contact.email}</span></div>}
                                            {contact.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-gray-400" /><span>{contact.phone}</span></div>}
                                            {!contact.email && !contact.phone && <span className="text-sm text-gray-400">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{contact.city || contact.country ? <div className="flex items-center gap-2 text-sm text-gray-700"><MapPin className="w-4 h-4 text-gray-400" /><span>{[contact.city, contact.country].filter(Boolean).join(', ')}</span></div> : <span className="text-sm text-gray-400">-</span>}</td>
                                    <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contact.status || 'lead')}`}>{getStatusLabel(contact.status || 'lead')}</span></td>
                                    <td className="px-6 py-4">{contact.rating ? <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < contact.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}</div> : <span className="text-sm text-gray-400">-</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
