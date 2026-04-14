import { Star, Mail, Phone, Building2, Briefcase, Send, Linkedin, MessageCircle, Edit, Trash2 } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Contact = Database['public']['Tables']['contacts']['Row'];

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i < rating
            ? 'text-amber-400 fill-amber-400'
            : 'text-gray-300 fill-gray-300'
        }`}
      />
    ));
  };

  return (
    <div
      className="glass-card p-5 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={contact.full_name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white/50 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold ring-2 ring-white/50 shadow-lg">
              {getInitials(contact.full_name)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-lg truncate">
              {contact.full_name}
            </h3>
          </div>

          {contact.job_title && (
            <p className="text-sm text-gray-600 truncate mb-2">
              {contact.job_title}
            </p>
          )}

          {contact.rating && (
            <div className="flex gap-0.5 mb-2">
              {renderStars(contact.rating)}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2">
            {contact.status && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusColors[contact.status] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {contact.status}
              </span>
            )}
            {contact.source && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                {contact.source}
              </span>
            )}
            {contact.tags && contact.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700"
              >
                {tag}
              </span>
            ))}
            {contact.tags && contact.tags.length > 2 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                +{contact.tags.length - 2}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onSendOffer) {
                onSendOffer(contact);
              }
            }}
            className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            title="Envoyer offre"
          >
            <Send className="w-5 h-5 text-white" fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50">
        <div className="flex gap-2">
          {contact.email && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:${contact.email}`;
              }}
              className="w-9 h-9 bg-gradient-to-br from-blue-50 to-blue-100/60 hover:from-blue-100 hover:to-blue-200/80 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-md"
              title="Email"
            >
              <Mail className="w-4 h-4 text-blue-600" />
            </button>
          )}

          {contact.phone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}`, '_blank');
              }}
              className="w-9 h-9 bg-gradient-to-br from-green-50 to-green-100/60 hover:from-green-100 hover:to-green-200/80 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-md"
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
            </button>
          )}

          {contact.linkedin_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(contact.linkedin_url, '_blank');
              }}
              className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200/60 hover:from-blue-200 hover:to-blue-300/80 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-md"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4 text-blue-700" />
            </button>
          )}
        </div>

        {(contact.company || contact.email) && (
          <div className="text-xs text-gray-500 truncate max-w-[150px]">
            {contact.company || contact.email}
          </div>
        )}
      </div>
    </div>
  );
}
