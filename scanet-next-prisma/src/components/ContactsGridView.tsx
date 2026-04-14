'use client';

import { ContactCard } from './ContactCard';
import type { Contact } from '@/types';

interface ContactsGridViewProps {
    contacts: Contact[];
    onContactClick: (contact: Contact) => void;
    onSendOffer?: (contact: Contact) => void;
}

export function ContactsGridView({ contacts, onContactClick, onSendOffer }: ContactsGridViewProps) {
    if (contacts.length === 0) {
        return (
            <div className="text-center py-12 glass-card">
                <p className="text-gray-500 font-medium">Aucun contact trouvé</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} onClick={() => onContactClick(contact)} onSendOffer={onSendOffer} />
            ))}
        </div>
    );
}
